import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, amount, payment_id, order_id, bonus_amount } = body;

    if (action === 'create_order') {
      // Create Razorpay order
      const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // in paise
          currency: 'INR',
          receipt: `w_${Date.now()}`,
        }),
      });

      const order = await orderResponse.json();

      if (!orderResponse.ok) {
        return new Response(JSON.stringify({ error: 'Failed to create order', details: order }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ order_id: order.id, key_id: razorpayKeyId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'verify_payment') {
      // Verify payment with Razorpay
      const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${payment_id}`, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
        },
      });

      const payment = await paymentResponse.json();

      if (payment.status === 'captured' || payment.status === 'authorized') {
        const paidAmount = payment.amount / 100;
        const bonusAmt = typeof bonus_amount === 'number' && bonus_amount > 0 ? bonus_amount : 0;
        const totalCredit = paidAmount + bonusAmt;

        // Get or create wallet
        let { data: wallet } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('user_id', user.id)
          .single();

        if (!wallet) {
          const { data: newWallet } = await supabase
            .from('wallets')
            .insert({ user_id: user.id, balance: 0 })
            .select()
            .single();
          wallet = newWallet;
        }

        if (wallet) {
          // Credit wallet with total (paid + bonus)
          await supabase
            .from('wallets')
            .update({ balance: wallet.balance + totalCredit })
            .eq('id', wallet.id);

          // Record transaction
          const desc = bonusAmt > 0
            ? `Added ₹${totalCredit} via Razorpay (₹${paidAmount} paid + ₹${bonusAmt} bonus)`
            : `Added ₹${paidAmount} via Razorpay`;
          const descHi = bonusAmt > 0
            ? `Razorpay से ₹${totalCredit} जोड़े (₹${paidAmount} भुगतान + ₹${bonusAmt} बोनस)`
            : `Razorpay से ₹${paidAmount} जोड़े`;

          await supabase
            .from('wallet_transactions')
            .insert({
              wallet_id: wallet.id,
              user_id: user.id,
              type: 'credit',
              amount: totalCredit,
              description: desc,
              description_hi: descHi,
              reference_type: 'razorpay',
              reference_id: payment_id,
            });
        }

        return new Response(JSON.stringify({ success: true, amount: totalCredit }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Payment not verified', status: payment.status }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

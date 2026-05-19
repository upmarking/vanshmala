import { useLanguage } from '@/contexts/LanguageContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';

const faqs = [
  {
    questionEn: "What is Vanshmala?",
    questionHi: "वंशमाला क्या है?",
    answerEn: "Vanshmala is a digital genealogy platform designed specifically to help families build, preserve, and connect their family lineages across generations. It serves as a modern digital register (Vanshavali) for your family heritage.",
    answerHi: "वंशमाला एक डिजिटल वंशावली मंच है जिसे विशेष रूप से परिवारों को उनकी पारिवारिक पीढ़ियों को बनाने, संरक्षित करने और जोड़ने में मदद करने के लिए डिज़ाइन किया गया है। यह आपकी पारिवारिक विरासत के लिए एक आधुनिक डिजिटल रजिस्टर (वंशावली) के रूप में कार्य करता है।"
  },
  {
    questionEn: "How do I create my family tree on Vanshmala?",
    questionHi: "मैं वंशमाला पर अपना वंशवृक्ष कैसे बनाऊं?",
    answerEn: "Once you register, you can start building your family tree by adding members, defining relationships (parents, children, spouses), and uploading photos or life journey events. You can easily drag and expand branches to grow your tree.",
    answerHi: "एक बार जब आप पंजीकरण कर लेते हैं, तो आप सदस्यों को जोड़कर, संबंधों (माता-पिता, बच्चों, जीवनसाथी) को परिभाषित करके और तस्वीरें या जीवन यात्रा की घटनाओं को अपलोड करके अपना वंशवृक्ष बनाना शुरू कर सकते हैं। आप आसानी से शाखाओं को खींचकर और विस्तारित करके अपना पेड़ बढ़ा सकते हैं।"
  },
  {
    questionEn: "Is my family tree data private and secure?",
    questionHi: "क्या मेरे वंशवृक्ष का डेटा निजी और सुरक्षित है?",
    answerEn: "Yes, privacy is our top priority. Your family tree data is controlled by your family admin. You can set visibility options to keep details fully private within the family network, or share read-only public access tokens with trusted relatives.",
    answerHi: "हाँ, गोपनीयता हमारी सर्वोच्च प्राथमिकता है। आपका वंशवृक्ष डेटा आपके पारिवारिक व्यवस्थापक द्वारा नियंत्रित किया जाता है। आप पारिवारिक नेटवर्क के भीतर विवरणों को पूरी तरह से निजी रखने के लिए दृश्यता विकल्प सेट कर सकते हैं, या विश्वसनीय रिश्तेदारों के साथ केवल पढ़ने के लिए सार्वजनिक एक्सेस टोकन साझा कर सकते हैं।"
  },
  {
    questionEn: "What is a Vanshmala ID?",
    questionHi: "वंशमाला ID क्या है?",
    answerEn: "A Vanshmala ID is a unique genealogical identifier assigned to each person in the tree. It acts like a digital gotra/lineage marker, allowing relatives to identify and link profiles without duplicate records.",
    answerHi: "वंशमाला ID एक अद्वितीय वंशावली पहचानकर्ता है जो पेड़ के प्रत्येक व्यक्ति को सौंपा गया है। यह एक डिजिटल गोत्र/वंशावली मार्कर की तरह कार्य करता है, जिससे रिश्तेदारों को डुप्लिकेट रिकॉर्ड के बिना प्रोफाइल की पहचान करने और लिंक करने की अनुमति मिलती है।"
  },
  {
    questionEn: "Can I merge my family tree with a relative's tree?",
    questionHi: "क्या मैं अपने वंशवृक्ष को किसी रिश्तेदार के पेड़ के साथ मर्ज कर सकता हूँ?",
    answerEn: "Yes! Vanshmala includes a Smart Profile Merging utility. If another relative has built their branch, you can request a merge. Once approved by both admins, the trees seamlessly link together into a single, unified lineage.",
    answerHi: "हाँ! वंशमाला में स्मार्ट प्रोफ़ाइल मर्जिंग की सुविधा शामिल है। यदि किसी अन्य रिश्तेदार ने अपनी शाखा बनाई है, तो आप विलय का अनुरोध कर सकते हैं। दोनों व्यवस्थापकों द्वारा अनुमोदित होने के बाद, पेड़ आसानी से एक एकीकृत वंशावली में जुड़ जाते हैं।"
  },
  {
    questionEn: "Does Vanshmala support Kundali matching and VanshMitra AI?",
    questionHi: "क्या वंशमाला कुंडली मिलान और वंशमित्र AI का समर्थन करता है?",
    answerEn: "Yes. Vanshmala features a Kundali matching module for astrological relationship insights, and VanshMitra, a friendly voice-enabled AI companion, to help you query family data and ask questions about your genealogy and traditions.",
    answerHi: "हाँ। वंशमाला में ज्योतिषीय संबंधों की जानकारी के लिए कुंडली मिलान मॉड्यूल है, और आपके पारिवारिक डेटा को खोजने तथा आपकी वंशावली और परंपराओं के बारे में प्रश्न पूछने में मदद करने के लिए एक अनुकूल आवाज-सक्षम AI साथी 'वंशमित्र' शामिल है।"
  }
];

const FAQSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-border/50" />
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-saffron/50 text-2xl block mb-3">✦</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t('Frequently Asked Questions', 'अक्सर पूछे जाने वाले प्रश्न')}
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            {t(
              'Find answers to common questions about Vanshmala genealogy, privacy, and linking family lineages.',
              'वंशमाला वंशावली, गोपनीयता और पारिवारिक वंशावली को जोड़ने के बारे में सामान्य प्रश्नों के उत्तर खोजें।'
            )}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="border-b last:border-b-0 border-border/60 py-2">
                <AccordionTrigger className="text-left font-display text-base md:text-lg font-medium text-foreground hover:text-saffron hover:no-underline transition-colors py-4">
                  {t(faq.questionEn, faq.questionHi)}
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm md:text-base text-muted-foreground leading-relaxed pt-2 pb-4">
                  {t(faq.answerEn, faq.answerHi)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;

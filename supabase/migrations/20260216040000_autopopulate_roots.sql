-- Function to autopopulate roots from father
CREATE OR REPLACE FUNCTION public.autopopulate_child_roots()
RETURNS TRIGGER AS $$
DECLARE
    father_record RECORD;
BEGIN
    -- Only proceed if any of the target fields are missing
    IF (NEW.mool_niwas IS NULL OR NEW.kuldevi IS NULL OR NEW.kuldevta IS NULL OR NEW.gotra IS NULL) THEN
        
        -- Find the father
        -- We look for a 'parent' relationship where the 'from' member is male
        SELECT fm.*
        INTO father_record
        FROM public.family_relationships fr
        JOIN public.family_members fm ON fr.from_member_id = fm.id
        WHERE fr.to_member_id = NEW.id
          AND fr.relationship = 'parent'
          AND fm.gender = 'male'
        LIMIT 1;

        -- If father is found, populate missing fields
        IF FOUND THEN
            IF NEW.mool_niwas IS NULL AND father_record.mool_niwas IS NOT NULL THEN
                NEW.mool_niwas := father_record.mool_niwas;
            END IF;
            
            IF NEW.kuldevi IS NULL AND father_record.kuldevi IS NOT NULL THEN
                NEW.kuldevi := father_record.kuldevi;
            END IF;
            
            IF NEW.kuldevta IS NULL AND father_record.kuldevta IS NOT NULL THEN
                NEW.kuldevta := father_record.kuldevta;
            END IF;
            
            IF NEW.gotra IS NULL AND father_record.gotra IS NOT NULL THEN
                NEW.gotra := father_record.gotra;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run BEFORE INSERT or UPDATE on family_members
-- Note: We need this to run on UPDATE as well, in case the relationship is added *after* the member is created, 
-- or if the member is updated and still misses data. 
-- However, relationships are in a separate table.
-- IF the relationship is added, `family_members` isn't necessarily updated.
-- SO: We actually need a trigger on `family_relationships` to update the child `family_members` row.

-- Trigger 1: When Family Member is Inserted/Updated (e.g. manual edit or initial creation)
-- This covers cases where relationship already exists or is being set (though usually rels are separate).
-- Actually, for `useAddMember` logic, member is created THEN relationship.
-- So when Member is created, it has NO relations yet. This trigger won't find a father.
-- So we need a trigger on `family_relationships`!

CREATE OR REPLACE FUNCTION public.autopopulate_child_roots_on_relationship()
RETURNS TRIGGER AS $$
DECLARE
    father_record RECORD;
    child_record RECORD;
BEGIN
    -- Only proceed if it's a parent relationship
    IF (NEW.relationship = 'parent') THEN
        
        -- Check if the 'from' member is male (Father)
        SELECT * INTO father_record FROM public.family_members WHERE id = NEW.from_member_id AND gender = 'male';
        
        IF FOUND THEN
            -- Fetch the child to see what's missing
            SELECT * INTO child_record FROM public.family_members WHERE id = NEW.to_member_id;
            
            -- Prepare updates if needed
            -- We update the child directly
            UPDATE public.family_members
            SET 
                mool_niwas = COALESCE(mool_niwas, father_record.mool_niwas),
                kuldevi = COALESCE(kuldevi, father_record.kuldevi),
                kuldevta = COALESCE(kuldevta, father_record.kuldevta),
                gotra = COALESCE(gotra, father_record.gotra)
            WHERE id = NEW.to_member_id
              AND (mool_niwas IS NULL OR kuldevi IS NULL OR kuldevta IS NULL OR gotra IS NULL);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to family_relationships
DROP TRIGGER IF EXISTS trigger_autopopulate_on_relationship ON public.family_relationships;
CREATE TRIGGER trigger_autopopulate_on_relationship
    AFTER INSERT ON public.family_relationships
    FOR EACH ROW
    EXECUTE FUNCTION public.autopopulate_child_roots_on_relationship();

-- We also want to handle the case where the Father's profile is updated, and we want to propagate to children?
-- The user request was "if our database know's Fathers Details... Just autopopulate for Child".
-- This usually implies at the moment of creation/linking. Cascading updates might be too aggressive (what if child moved?).
-- I will stick to "Autopopulate for Child" implies "When Child is added/linked".

-- However, `family_members` trigger is still useful if the child is updated and somehow now valid? 
-- No, the relationship trigger is the robust one for the "New Child added" flow which does Insert Member -> Insert Relation.
-- If I just rely on relationship trigger, it covers the main use case.


    -- Test Data: 10 Lost Items, 10 Found Items, and 10 Matches
    -- Run this to create test data for rejection testing

    -- First, get a user ID (replace with your actual user ID if needed)
    DO $$
    DECLARE
        v_user_id UUID;
        v_lost_id UUID;
        v_found_id UUID;
        i INTEGER;
    BEGIN
        -- Get the first user from the database
        SELECT id INTO v_user_id FROM users LIMIT 1;
        
        IF v_user_id IS NULL THEN
            RAISE EXCEPTION 'No users found. Please create a user first.';
        END IF;

        RAISE NOTICE 'Using user ID: %', v_user_id;

        -- Create 10 pairs of lost/found items with matches
        FOR i IN 1..10 LOOP
            -- Insert Lost Item
            INSERT INTO lost_items (
                user_id,
                item_name,
                item_category,
                description,
                location,
                area,
                datetime_lost,
                owner_name,
                owner_contact,
                status
            ) VALUES (
                v_user_id,
                'Test Lost Item ' || i,
                CASE (i % 5)
                    WHEN 0 THEN 'Electronics'
                    WHEN 1 THEN 'Documents'
                    WHEN 2 THEN 'Accessories'
                    WHEN 3 THEN 'Bags'
                    ELSE 'Others'
                END,
                'Test description for lost item ' || i || '. This is a test item for rejection testing.',
                'Test Location ' || i,
                'Test Area ' || i,
                NOW() - (i || ' days')::INTERVAL,
                'Test Owner ' || i,
                '123456789' || i,
                'active'
            ) RETURNING id INTO v_lost_id;

            -- Insert Found Item
            INSERT INTO found_items (
                user_id,
                item_name,
                item_category,
                description,
                location,
                area,
                datetime_found,
                finder_name,
                finder_contact,
                status
            ) VALUES (
                v_user_id,
                'Test Found Item ' || i,
                CASE (i % 5)
                    WHEN 0 THEN 'Electronics'
                    WHEN 1 THEN 'Documents'
                    WHEN 2 THEN 'Accessories'
                    WHEN 3 THEN 'Bags'
                    ELSE 'Others'
                END,
                'Test description for found item ' || i || '. This matches lost item ' || i,
                'Test Location ' || i,
                'Test Area ' || i,
                NOW() - (i || ' days')::INTERVAL,
                'Test Finder ' || i,
                '987654321' || i,
                'active'
            ) RETURNING id INTO v_found_id;

            -- Create Match
            INSERT INTO matches (
                lost_item_id,
                found_item_id,
                match_score,
                status,
                breakdown
            ) VALUES (
                v_lost_id,
                v_found_id,
                70 + (i * 2), -- Scores from 72 to 90
                'pending',
                jsonb_build_object(
                    'category_score', 20,
                    'location_score', 15,
                    'tfidf_score', 20,
                    'fuzzy_score', 8,
                    'attribute_score', 0,
                    'purpose_score', 0,
                    'image_score', 0,
                    'date_score', 7,
                    'total_score', 70 + (i * 2)
                )
            );

            RAISE NOTICE 'Created pair %: Lost ID %, Found ID %', i, v_lost_id, v_found_id;
        END LOOP;

        RAISE NOTICE 'Test data creation complete!';
    END $$;

    -- Verify the data
    SELECT 
        'Lost Items' as type,
        COUNT(*) as count
    FROM lost_items
    WHERE item_name LIKE 'Test Lost Item%'
    UNION ALL
    SELECT 
        'Found Items' as type,
        COUNT(*) as count
    FROM found_items
    WHERE item_name LIKE 'Test Found Item%'
    UNION ALL
    SELECT 
        'Matches' as type,
        COUNT(*) as count
    FROM matches
    WHERE lost_item_id IN (
        SELECT id FROM lost_items WHERE item_name LIKE 'Test Lost Item%'
    );

    -- View the matches
    SELECT 
        m.id as match_id,
        l.item_name as lost_item,
        f.item_name as found_item,
        m.match_score,
        m.status
    FROM matches m
    JOIN lost_items l ON m.lost_item_id = l.id
    JOIN found_items f ON m.found_item_id = f.id
    WHERE l.item_name LIKE 'Test Lost Item%'
    ORDER BY m.match_score DESC;

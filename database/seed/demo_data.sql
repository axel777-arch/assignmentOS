INSERT INTO users (id, email, display_name) VALUES ('00000000-0000-4000-8000-000000000001', 'student@example.test', 'Student') ON CONFLICT (id) DO NOTHING;
INSERT INTO assignments (id,user_id,title,course,subject,due,instructions,target_words,min_words,max_words,source_target) VALUES ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','Electrolysis and its applications','Chemistry 201','CHEMISTRY · LAB REPORT',CURRENT_DATE + 4,'Write a 1,200 to 1,500 word chemistry report on electrolysis. Explain the process, discuss Faraday''s laws, describe two applications, and use at least four sources.',1350,1200,1500,4) ON CONFLICT (id) DO NOTHING;
INSERT INTO requirements (id,assignment_id,text,kind,status,position) VALUES
('r-topic','10000000-0000-4000-8000-000000000001','Explain the electrolysis process','concept','not_checked',1),
('r-laws','10000000-0000-4000-8000-000000000001','Discuss Faraday''s laws','concept','not_checked',2),
('r-apps','10000000-0000-4000-8000-000000000001','Describe two applications','concept','not_checked',3),
('r-sources','10000000-0000-4000-8000-000000000001','Use at least 4 identifiable sources','sources','not_checked',4),
('r-length','10000000-0000-4000-8000-000000000001','Write between 1,200 and 1,500 words','length','not_checked',5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO drafts (assignment_id,content) VALUES ('10000000-0000-4000-8000-000000000001','<h2>Electrolysis: an introduction</h2><p>Electrolysis uses an external electrical current to drive a chemical reaction that would not occur spontaneously.</p><h3>Faraday''s laws</h3><p>The amount of substance produced at an electrode is proportional to the total electric charge passed through the cell.</p><h3>Applications</h3><p>Electroplating deposits a thin metal coating on an object.</p><h3>References</h3><p>Faraday, M. Experimental Researches in Electricity.</p>') ON CONFLICT (assignment_id) DO NOTHING;

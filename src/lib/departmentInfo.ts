export type DepartmentGalleryShot = { src: string; alt: string };

export type DepartmentInfo = {
  /** The opening line. Set larger than the rest on the page. */
  summary: string;
  /** What the department treats and what a visit involves. */
  body: string[];
  /** Common reasons to be referred or to come. */
  seenHere: string[];
  /**
   * Conditions the speciality treats, each with one line saying what it is.
   * A name on its own — "glaucoma", "pre-eclampsia" — tells a patient
   * nothing, which is the whole reason they are reading the page.
   */
  conditions?: { name: string; note: string }[];
  /**
   * Signs that should bring somebody to this department rather than to
   * another. Written as things a patient can notice about themselves, not as
   * findings a clinician would record.
   */
  whenToCome?: string[];
  /** What actually happens at a visit, in order. */
  visit?: string[];
  /** Tests and procedures the speciality routinely uses. */
  tests?: string[];
  /** Anything that means "do not wait for a clinic appointment". */
  urgent?: string[];
  /**
   * Published research from IIT Kharagpur touching this speciality.
   *
   * EVERY ENTRY COMES FROM THE INSTITUTE'S OWN PUBLICATIONS LISTING at
   * smst.iitkgp.ac.in/Smst/publication/journal. That matters: it is what
   * establishes the IIT Kharagpur affiliation. A citation found through a
   * search engine is not good enough — the first candidate checked for this
   * feature was widely reported as an IIT Kharagpur paper and its own arXiv
   * record names no institution at all.
   *
   * These are NOT services. The hospital does not offer retinal implants
   * because the institute publishes on retinal electrode arrays, and the page
   * says so in as many words above the list.
   *
   * No links. A citation is enough to find the paper, and a hyperlink to a
   * publisher is one more thing to rot.
   */
  research?: {
    authors: string;
    title: string;
    journal: string;
    year: string;
    /**
     * Resolved against Crossref and checked title-by-title before being
     * written, so the link lands on the paper named beside it. A link on a
     * hospital page that opens the wrong paper is worse than no link.
     */
    doi: string;
  }[];
  gallery: DepartmentGalleryShot[];
};

/**
 * What each speciality is, in plain words.
 *
 * These describe the discipline, not this hospital. Nothing here claims a
 * procedure, a machine or a service that this building has — a patient reading
 * that ophthalmology treats cataract learns what the department is for, which
 * is true of the speciality everywhere, and is told nothing about what is
 * available on any given day. That is the line these stay on, and it is why
 * none of them mentions equipment, theatre time or admission.
 *
 * A description written by the desk in the departments table always wins over
 * the summary here; this is the fallback so that no department page is blank.
 *
 * Gallery photographs are public domain and illustrate the speciality, not
 * this building. A department with no apt picture simply has no gallery —
 * padding one out with a loosely related image would be worse than the gap.
 */
const INFO: { match: RegExp; info: DepartmentInfo }[] = [
  {
    match: /general medicine|internal medicine/i,
    info: {
      summary:
        "The first stop for most adult illness, and the department that sees the widest range of complaints.",
      body: [
        "Physicians in general medicine diagnose and treat conditions of the body's internal organs. They are trained to take a complaint that has not yet been named — a fever that will not settle, breathlessness, pain, weight that is falling — work out what is behind it, and either treat it or send the patient to the speciality that should.",
        "A first visit is mostly conversation and examination. The consultant will ask about the history of the complaint, examine the patient, and order blood or imaging tests where they are needed before settling on a diagnosis.",
      ],
      seenHere: [
        "Fever and infection",
        "Diabetes and thyroid disorders",
        "High blood pressure",
        "Chest and breathing complaints",
        "Stomach, liver and kidney complaints",
        "Follow-up of long-term conditions",
      ],
      conditions: [
        {
          name: "Fever that will not settle",
          note: "A temperature lasting more than a few days where the cause has not been found.",
        },
        {
          name: "Diabetes",
          note: "Blood sugar the body can no longer control on its own. Managed for life rather than cured.",
        },
        {
          name: "High blood pressure",
          note: "Pressure high enough to damage the heart, kidneys and eyes over years, usually with no symptoms at all.",
        },
        {
          name: "Thyroid disorders",
          note: "A gland in the neck working too hard or too little, which shifts weight, energy, mood and heart rate.",
        },
        {
          name: "Anaemia",
          note: "Too few healthy red cells to carry oxygen, which shows as tiredness and breathlessness.",
        },
        {
          name: "Chest infection",
          note: "Infection in the airways or the lungs, with cough, fever and difficulty breathing.",
        },
        {
          name: "Liver and kidney disease",
          note: "Organs failing to clear waste, often found on a blood test before a patient feels unwell.",
        },
      ],
      whenToCome: [
        "A fever that has lasted more than three or four days",
        "Tiredness or weight loss you cannot account for",
        "A cough that has not cleared in three weeks",
        "Being told at a camp or a check-up that your sugar or blood pressure is high",
        "A long-term condition that is due for its regular review",
      ],
      visit: [
        "The consultant takes the history first: when it started, what makes it worse, what else has changed, and what you already take.",
        "Then an examination — pulse, blood pressure, temperature, and listening to the chest and the abdomen.",
        "Blood or urine tests are ordered where they will change the answer. Many are sent the same day and reviewed at the next visit.",
        "You leave with a diagnosis or a plan to reach one, a prescription if it is needed, and a date to come back.",
      ],
      tests: [
        "Blood count, blood sugar and HbA1c",
        "Liver and kidney function tests",
        "Thyroid function tests",
        "Urine examination",
        "Chest radiograph",
        "Electrocardiogram",
      ],
      urgent: [
        "Chest pain, or pain spreading to the arm or jaw",
        "Breathlessness at rest",
        "Confusion, fainting or a fit",
        "Vomiting blood, or black stools",
      ],
      research: [
        {
          authors: "Dutta G.",
          title: "Electrochemical biosensors for rapid detection of malaria",
          journal: "Materials Science for Energy Technologies",
          year: "2020",
          doi: "10.1016/j.mset.2019.10.003",
        },
        {
          authors: "Chaudhary A., Bag S., Banerjee P., Chatterjee J.",
          title:
            "Wound healing efficacy of Jamun honey in diabetic mice model through reepithelialization, collagen deposition and angiogenesis",
          journal: "Journal of Traditional and Complementary Medicine",
          year: "2019",
          doi: "10.1016/j.jtcme.2019.10.002",
        },
        {
          authors: "Awasthi K. et al.",
          title:
            "Impedimetric blood pH sensor based on MoS2 Nafion coated microelectrode",
          journal: "RSC Advances",
          year: "2016",
          doi: "10.1039/c6ra17786g",
        },
      ],
      gallery: [
        {
          src: "/images/dept/medicine-1.jpg",
          alt: "A doctor examining a patient with a stethoscope",
        },
        {
          src: "/images/dept/medicine-2.jpg",
          alt: "A consultation in progress at a clinic",
        },
      ],
    },
  },
  {
    match: /paediatric|pediatric|child|neonat/i,
    info: {
      summary:
        "Medical care for infants, children and adolescents, from the newborn to the school-leaver.",
      body: [
        "Paediatricians treat childhood illness and infection, and they also watch the things that only show up over time — whether a child is growing as expected, feeding well, reaching the milestones of movement and speech at the ages they are usually reached.",
        "Much of the department's work is reassurance. A great deal of what worries a parent turns out to be ordinary, and saying so plainly is part of the job; what is not ordinary is picked up early because the child is being seen regularly.",
      ],
      seenHere: [
        "Fever, cough and childhood infection",
        "Growth and development concerns",
        "Feeding and nutrition",
        "Immunisation advice",
        "Asthma and allergy",
        "Newborn checks",
      ],
      conditions: [
        {
          name: "Fever in a child",
          note: "The commonest reason a child is brought in. Most are viral; the work is telling those apart from the few that are not.",
        },
        {
          name: "Diarrhoea and vomiting",
          note: "Dangerous in small children mainly because of the water they lose, not the infection itself.",
        },
        {
          name: "Cough, wheeze and asthma",
          note: "Repeated wheezing or a night cough that keeps a child from sleeping or from playing.",
        },
        {
          name: "Poor weight gain",
          note: "A child not growing along their expected line, followed on a growth chart over months.",
        },
        {
          name: "Anaemia and nutritional deficiency",
          note: "Low iron or vitamins, common at weaning and in the school years, and treatable.",
        },
        {
          name: "Skin and ear infections",
          note: "Rashes, boils and earache, which in children can flare quickly.",
        },
        {
          name: "Newborn problems",
          note: "Jaundice, feeding difficulty and slow weight gain in the first weeks.",
        },
      ],
      whenToCome: [
        "Fever lasting more than two days in a child over three months old",
        "Not feeding, or fewer wet nappies than usual",
        "A cough that disturbs sleep, or wheezing",
        "Not gaining weight, or falling away from the growth chart",
        "Vaccination that is due or overdue",
      ],
      visit: [
        "The child is weighed and measured, and the readings are plotted on a growth chart so the trend is visible rather than just today's number.",
        "The consultant asks about feeding, sleep, stools, activity and immunisation, then examines the child.",
        "Doses are worked out by weight, so the weight is taken at every visit rather than carried over from the last one.",
        "You leave knowing what to watch for at home and exactly when to bring the child back sooner.",
      ],
      tests: [
        "Growth measurement and plotting",
        "Blood count and haemoglobin",
        "Urine examination",
        "Blood sugar",
        "Chest radiograph where a chest infection is suspected",
      ],
      urgent: [
        "A baby under three months with any fever",
        "Breathing that is fast, noisy, or pulling in at the ribs",
        "A child who is floppy, unusually drowsy, or will not wake properly",
        "A fit, or a rash that does not fade when pressed",
        "Refusing all feeds, or passing no urine for many hours",
      ],
      research: [
        {
          authors: "Arya A. et al.",
          title:
            "Immunogenicity and safety of two doses of catch-up immunization with Haemophilus influenzae type b conjugate vaccine in Indian children living with HIV",
          journal: "Vaccine",
          year: "2016",
          doi: "10.1016/j.vaccine.2016.03.012",
        },
        {
          authors: "Khan M. et al.",
          title:
            "Impact of pneumococcal conjugate vaccine on the carriage density of Streptococcus pneumoniae and Staphylococcus aureus in children living with HIV",
          journal: "Human Vaccines & Immunotherapeutics",
          year: "2020",
          doi: "10.1080/21645515.2019.1706411",
        },
        {
          authors: "Mukhopadhyay S. et al.",
          title:
            "Evaluation of functional mobility outcomes following electrical stimulation in children with spastic cerebral palsy",
          journal: "Journal of Child Neurology",
          year: "2017",
          doi: "10.1177/0883073817700604",
        },
      ],
      gallery: [
        {
          src: "/images/dept/paediatrics-1.jpg",
          alt: "A physician examining a child at a clinic",
        },
        {
          src: "/images/dept/paediatrics-2.jpg",
          alt: "Medical staff examining young patients at a clinic",
        },
      ],
    },
  },
  {
    match: /ophthal|eye/i,
    info: {
      summary: "Care of the eye and of sight, from a routine vision test to surgery.",
      body: [
        "Ophthalmologists test vision and examine the structures of the eye — the lens, the retina, the pressure inside the eye — to find the cause of blurring, pain, redness or loss of sight. Some of what they find is corrected with spectacles; some needs medication, and some needs an operation.",
        "Several of the conditions the department treats are silent until they are advanced. Glaucoma damages sight before it is noticed, and diabetes can injure the retina while vision still seems fine, which is why anyone with diabetes is asked to have their eyes examined even when nothing appears wrong.",
      ],
      seenHere: [
        "Cataract",
        "Glaucoma",
        "Diabetic eye disease",
        "Refractive error and spectacles",
        "Eye infection and injury",
        "Watering, redness and irritation",
      ],
      conditions: [
        {
          name: "Cataract",
          note: "The eye's own lens turning cloudy with age, so vision dims and glare worsens. Treated by surgery.",
        },
        {
          name: "Glaucoma",
          note: "Pressure inside the eye damaging the optic nerve. It takes side vision first, and painlessly, which is why it is found on testing rather than felt.",
        },
        {
          name: "Refractive error",
          note: "Short sight, long sight and astigmatism — the eye not focusing light on the retina. Corrected with glasses.",
        },
        {
          name: "Diabetic retinopathy",
          note: "Damage to the small vessels at the back of the eye caused by diabetes. Anyone with diabetes needs the retina examined regularly.",
        },
        {
          name: "Conjunctivitis",
          note: "Redness, watering and discharge, from infection or from allergy.",
        },
        {
          name: "Dry eye",
          note: "Burning, grittiness and watering, from tears that are too few or evaporate too quickly.",
        },
        {
          name: "Squint and lazy eye",
          note: "Eyes that do not align, or one eye that has not developed full sight. Best treated young.",
        },
      ],
      whenToCome: [
        "Blurred vision, or vision that has changed over months",
        "Difficulty reading, or holding print further away than before",
        "Glare and haloes around lights at night",
        "Redness, watering or a gritty feeling that will not settle",
        "Diabetes, for the yearly retinal examination even when sight seems normal",
      ],
      visit: [
        "Sight is measured first on a chart, each eye separately, with and without your glasses.",
        "The front of the eye is examined on a slit lamp — a microscope with a bright slit of light.",
        "Eye pressure is measured where glaucoma is a question.",
        "Drops may be used to widen the pupil so that the retina can be seen. They blur vision for several hours, so do not plan to drive or ride home yourself.",
      ],
      tests: [
        "Visual acuity on a chart",
        "Refraction, for a spectacle prescription",
        "Slit lamp examination",
        "Intraocular pressure measurement",
        "Dilated retinal examination",
      ],
      urgent: [
        "Sudden loss of vision in one eye",
        "A curtain or shadow coming across the field of vision",
        "A sudden shower of floaters, or flashes of light",
        "Severe eye pain with redness and vomiting",
        "Any injury to the eye, or a chemical splash",
      ],
      research: [
        {
          authors: "Biswas S., Sikdar D., Das D., Mahadevappa M., Das S.",
          title:
            "PDMS based multielectrode arrays for superior in-vitro retinal stimulation and recording",
          journal: "Biomedical Microdevices",
          year: "2017",
          doi: "10.1007/s10544-017-0221-0",
        },
        {
          authors: "Mahadevappa M. et al.",
          title:
            "Classification of artifactual EEG signal and detection of multiple eye movement artifact zones",
          journal: "Signal, Image and Video Processing",
          year: "2016",
          doi: "10.1007/s11760-016-0943-0",
        },
      ],
      gallery: [
        {
          src: "/images/dept/eye-1.jpg",
          alt: "An eye examination being carried out at a clinic",
        },
        {
          src: "/images/dept/eye-2.jpg",
          alt: "A close view of a human eye",
        },
      ],
    },
  },
  {
    match: /gynae|obstet|maternity/i,
    info: {
      summary:
        "Women's reproductive health on one side, and pregnancy and childbirth on the other.",
      body: [
        "The gynaecology half of the department sees menstrual and hormonal problems, pain, infection, infertility, and conditions of the uterus and the ovaries. The obstetric half looks after pregnancy: confirming it, following it, watching for the complications that can arise, and caring for mother and baby after delivery.",
        "Antenatal care is a series of visits rather than a single consultation. Attending them in order matters more than any one of them, because most of what can be prevented in pregnancy is prevented by noticing a change early.",
      ],
      seenHere: [
        "Antenatal and postnatal care",
        "Menstrual and hormonal problems",
        "Pelvic pain and infection",
        "Conditions of the uterus and ovaries",
        "Contraception advice",
        "Infertility",
      ],
      conditions: [
        {
          name: "Pregnancy care",
          note: "Routine checks through pregnancy — blood pressure, growth, and the baby's position and heartbeat.",
        },
        {
          name: "Heavy or irregular periods",
          note: "Bleeding heavy enough to cause anaemia, or a cycle that has changed.",
        },
        {
          name: "Period pain",
          note: "Pain severe enough to stop work or school, which is not something to be endured.",
        },
        {
          name: "Polycystic ovary syndrome",
          note: "A hormonal condition affecting periods, weight, skin and fertility.",
        },
        {
          name: "Fibroids",
          note: "Benign growths in the wall of the womb that can cause heavy bleeding and a feeling of pressure.",
        },
        {
          name: "Infection and discharge",
          note: "Discharge, itching or pain from infection, which is common and treatable.",
        },
        {
          name: "Difficulty conceiving",
          note: "Where pregnancy has not happened after a year of trying, or sooner over the age of thirty-five.",
        },
        {
          name: "Menopause",
          note: "The change in hormones around the end of periods, and the symptoms that come with it.",
        },
      ],
      whenToCome: [
        "A missed period, or a positive pregnancy test",
        "Bleeding that is heavier, longer or more often than usual",
        "Bleeding between periods, after intercourse, or after the menopause",
        "Pain in the lower abdomen that keeps returning",
        "Discharge, itching or soreness that has not settled",
      ],
      visit: [
        "The consultant asks about the cycle — when periods started, how long they last, how heavy they are — and about any pregnancies.",
        "Blood pressure and weight are recorded. In pregnancy they are recorded at every visit, because a change matters more than a single reading.",
        "An examination is done where it is needed, with a chaperone present, and never without explaining first.",
        "An ultrasound may be arranged, and blood tests where anaemia or a hormonal cause is suspected.",
      ],
      tests: [
        "Urine pregnancy test",
        "Blood count, blood group and haemoglobin",
        "Ultrasound of the abdomen and pelvis",
        "Blood sugar screening in pregnancy",
        "Cervical screening",
      ],
      urgent: [
        "Heavy bleeding that soaks through protection within an hour",
        "Severe lower abdominal pain, especially with a missed period",
        "In pregnancy: bleeding, severe headache, blurred vision, or reduced movements of the baby",
        "Fever with abdominal pain after childbirth or a procedure",
      ],
      research: [
        {
          authors: "Roychoudhury S. et al.",
          title:
            "Serum metabolomics of Indian women with polycystic ovary syndrome using 1H NMR coupled with a pattern recognition approach",
          journal: "Molecular BioSystems",
          year: "2016",
          doi: "10.1039/c6mb00420b",
        },
        {
          authors: "Banerjee P. et al.",
          title:
            "1H NMR serum metabonomics for understanding metabolic dysregulation in women with idiopathic recurrent spontaneous miscarriage",
          journal: "Journal of Proteome Research",
          year: "2014",
          doi: "10.1021/pr500379n",
        },
        {
          authors: "Singh A. et al.",
          title:
            "Markers of oxidative stress in follicular fluid of women with endometriosis",
          journal: "Reproductive Toxicology",
          year: "2013",
          doi: "10.1016/j.reprotox.2013.08.005",
        },
      ],
      gallery: [
        {
          src: "/images/dept/gynaecology-1.jpg",
          alt: "An obstetric ultrasound examination being carried out at a clinic",
        },
        {
          src: "/images/facility/ultrasound.jpg",
          alt: "An ultrasound examination room",
        },
      ],
    },
  },
  {
    match: /psychiatr|mental|psycho/i,
    info: {
      summary:
        "Diagnosis and treatment of mental illness, seen as an illness like any other.",
      body: [
        "Psychiatrists see depression, anxiety, disorders of sleep, addiction, and severe mental illness. Treatment may be medication, referral for counselling, or both, and it is usually reviewed over several visits rather than settled in one.",
        "What is said in a psychiatric consultation carries the same medical confidentiality as anything told to a physician or a surgeon.",
      ],
      seenHere: [
        "Depression and low mood",
        "Anxiety and panic",
        "Sleep disorders",
        "Addiction",
        "Severe mental illness",
        "Stress and adjustment difficulties",
      ],
      /* No public-domain photograph of a psychiatric consultation survives the
         licence filter without also being unmistakably a military clinic —
         camouflage, unit boards, a US flag patch — which would say something
         about this hospital that is not true. A quiet single room claims
         nothing and is at least of a hospital. */
      conditions: [
        {
          name: "Depression",
          note: "Low mood, loss of interest and low energy lasting weeks, heavy enough to affect work, study and relationships.",
        },
        {
          name: "Anxiety disorders",
          note: "Worry, fear or panic out of proportion to the situation, often with a racing heart, sweating and breathlessness.",
        },
        {
          name: "Sleep disorders",
          note: "Difficulty falling asleep, staying asleep, or waking too early, sustained over weeks.",
        },
        {
          name: "Stress and adjustment difficulty",
          note: "Difficulty coping after a loss, an illness, an examination, or a change in circumstances.",
        },
        {
          name: "Addiction",
          note: "Dependence on alcohol, tobacco or other substances, including the physical effects of stopping.",
        },
        {
          name: "Severe mental illness",
          note: "Conditions such as bipolar disorder and psychosis, which need long-term treatment and regular review.",
        },
        {
          name: "Obsessive-compulsive disorder",
          note: "Intrusive thoughts and repeated rituals that take up hours of the day.",
        },
      ],
      whenToCome: [
        "Low mood or loss of interest lasting more than two weeks",
        "Worry or fear that stops you doing ordinary things",
        "Sleep that has been poor for weeks",
        "Drinking or using more than you intend to, or being unable to stop",
        "Being told by people close to you that you have changed",
      ],
      visit: [
        "The first visit is mostly conversation, and it is longer than most clinic appointments.",
        "The consultant asks about mood, sleep, appetite and concentration, and about what has been happening around you.",
        "Physical causes are considered too — thyroid disease and anaemia both mimic depression — so blood tests are sometimes ordered.",
        "Treatment may be medication, talking therapy, or both. Medication for mood takes two to four weeks to work, and stopping it early is the commonest reason it appears not to.",
        "What you say is confidential. It is recorded in your notes and is not shared outside the clinical team without your consent.",
      ],
      tests: [
        "Structured clinical assessment",
        "Thyroid function tests",
        "Blood count and haemoglobin",
        "Blood sugar",
      ],
      urgent: [
        "Thoughts of ending your life, or of harming someone else",
        "Hearing or seeing things others do not",
        "Not eating or drinking",
        "Severe agitation, or confusion that has come on quickly",
        "Withdrawal from alcohol with shaking, sweating or a fit",
      ],
      research: [
        {
          authors: "Tibdewal M. N. et al.",
          title:
            "Multiple entropies performance measure for detection and localization of multi-channel epileptic EEG",
          journal: "Biomedical Signal Processing and Control",
          year: "2017",
          doi: "10.1016/j.bspc.2017.05.002",
        },
        {
          authors: "Roy S. et al.",
          title:
            "A fingertip force prediction model for grasp patterns characterised from the chaotic behaviour of EEG",
          journal: "Medical & Biological Engineering & Computing",
          year: "2017",
          doi: "10.1007/s11517-018-1833-0",
        },
      ],
      gallery: [
        {
          src: "/images/facility/ward.jpg",
          alt: "A quiet single room on a hospital ward",
        },
        {
          src: "/images/dept/psychiatry-1.jpg",
          alt: "A doctor listening to a patient across a desk",
        },
      ],
    },
  },
  {
    match: /dental|oral/i,
    info: {
      summary: "Care of the teeth, the gums and the mouth.",
      body: [
        "The department treats decay and dental pain, cleans and treats gum disease, extracts teeth that cannot be saved, and carries out surgical procedures on the teeth and the jaws. Much of it is straightforward and finished in a single visit.",
        "Dental pain rarely improves on its own and usually gets more difficult to treat the longer it is left. A tooth that could have been filled becomes a tooth that has to come out.",
      ],
      seenHere: [
        "Toothache and decay",
        "Gum disease",
        "Scaling and cleaning",
        "Extraction",
        "Root canal treatment",
        "Dental injury",
      ],
      conditions: [
        {
          name: "Dental caries",
          note: "Decay, where acid from bacteria dissolves the tooth. Painless at first, which is why it is found at check-ups.",
        },
        {
          name: "Gum disease",
          note: "Inflammation and bleeding of the gums. Left alone it loosens the teeth that sit in them.",
        },
        {
          name: "Toothache and abscess",
          note: "Pain from a nerve inflamed or infected inside the tooth, sometimes with swelling.",
        },
        {
          name: "Impacted wisdom tooth",
          note: "A back tooth with no room to come through, causing pain, swelling and repeated infection.",
        },
        {
          name: "Broken or knocked-out tooth",
          note: "From injury. A knocked-out adult tooth can sometimes be replaced if you come quickly.",
        },
        {
          name: "Missing teeth",
          note: "Replaced with dentures, bridges or crowns, so that chewing and speech are restored.",
        },
        {
          name: "Mouth ulcers and lesions",
          note: "Most settle within two weeks. One that does not needs to be looked at.",
        },
      ],
      whenToCome: [
        "Toothache, or sensitivity to hot and cold",
        "Gums that bleed when you brush",
        "A tooth that is loose, chipped or broken",
        "Swelling of the face or of the gum",
        "A mouth ulcer that has not healed in two weeks",
        "A check-up and cleaning, even with no pain",
      ],
      visit: [
        "The teeth, gums and soft tissues of the mouth are examined, and existing fillings and crowns are checked.",
        "Radiographs are taken where decay or infection may be hidden between teeth or below the gum.",
        "Cleaning removes the hard deposit that brushing cannot, which is what keeps gum disease going.",
        "Treatment is usually planned across visits, with the painful problem settled first.",
      ],
      tests: [
        "Examination of teeth, gums and soft tissues",
        "Intraoral radiographs",
        "Scaling and polishing",
        "Vitality testing of a tooth",
      ],
      urgent: [
        "Facial swelling, especially with fever or difficulty swallowing",
        "Bleeding that will not stop after an extraction",
        "A knocked-out adult tooth — keep it in milk and come at once",
        "Injury to the jaw",
      ],
      research: [
        {
          authors: "Bag S., Dutta D., Chaudhary A. et al.",
          title:
            "Identification of alpha-enolase as a prognostic and diagnostic precancer biomarker in oral submucous fibrosis",
          journal: "Journal of Clinical Pathology",
          year: "2018",
          doi: "10.1136/jclinpath-2017-204430",
        },
        {
          authors: "Dutta G. et al.",
          title:
            "Label-free electrochemical detection of S. mutans exploiting commercially fabricated printed circuit board sensing electrodes",
          journal: "Micromachines",
          year: "2019",
          doi: "10.3390/mi10090575",
        },
        {
          authors: "Nag S. et al.",
          title:
            "Segmentation and analysis of surface characteristics of oral tissues obtained by scanning electron microscopy",
          journal: "Tissue and Cell",
          year: "2019",
          doi: "10.1016/j.tice.2019.07.004",
        },
      ],
      gallery: [
        {
          src: "/images/dept/dental-1.jpg",
          alt: "A dentist examining a patient in a dental clinic",
        },
        {
          src: "/images/dept/dental-2.jpg",
          alt: "A routine dental cleaning being carried out",
        },
        {
          src: "/images/dept/dental-3.jpg",
          alt: "A dentist reviewing a patient's dental radiographs",
        },
      ],
    },
  },
  {
    match: /facio|maxillary/i,
    info: {
      summary: "Surgery of the face, the jaws and the mouth.",
      body: [
        "Surgeons in this department treat injuries to the facial bones, cysts and tumours of the jaw, impacted teeth that cannot be removed in an ordinary dental chair, and disorders of the joint that opens and closes the jaw.",
        "The work sits between dentistry and surgery, and cases often arrive by referral from the dental department or from emergency care after an injury.",
      ],
      seenHere: [
        "Facial and jaw fractures",
        "Impacted and buried teeth",
        "Cysts and tumours of the jaw",
        "Jaw joint disorders",
        "Oral lesions",
        "Facial infection",
      ],
      conditions: [
        {
          name: "Facial fracture",
          note: "A broken cheekbone, nose or eye socket, usually from a road accident, a fall or a blow.",
        },
        {
          name: "Jaw fracture",
          note: "A break in the upper or lower jaw, which changes how the teeth meet and makes eating difficult.",
        },
        {
          name: "Impacted teeth",
          note: "Teeth that cannot come through and have to be removed surgically.",
        },
        {
          name: "Cysts and tumours of the jaw",
          note: "Growths in the bone of the jaw, most of them benign, found on a radiograph or as a swelling.",
        },
        {
          name: "Temporomandibular joint disorder",
          note: "Pain, clicking or locking of the joint just in front of the ear.",
        },
        {
          name: "Facial infection",
          note: "Deep infection spreading from a tooth into the tissues of the face or the neck.",
        },
        {
          name: "Bite and jaw alignment",
          note: "Jaws that do not meet correctly, affecting chewing, speech and appearance.",
        },
      ],
      whenToCome: [
        "An injury to the face or the jaw",
        "Teeth that no longer meet the way they used to",
        "A swelling of the jaw or the face that is not settling",
        "Pain, clicking or locking of the jaw joint",
        "Difficulty opening the mouth fully",
      ],
      visit: [
        "The face and jaws are examined for symmetry, for how far the mouth opens, and for how the teeth meet.",
        "Radiographs of the jaws and facial bones are usually needed, because much of the problem is in bone.",
        "Where surgery is the answer, what it involves, what the recovery is, and what the alternatives are, are all set out before anything is agreed.",
        "Smaller procedures are done under local anaesthetic. Larger ones need planning and admission.",
      ],
      tests: [
        "Examination of the face, jaws and bite",
        "Radiographs of the jaws and facial bones",
        "Assessment of jaw opening and joint movement",
      ],
      urgent: [
        "Any injury to the face or the jaw",
        "Swelling in the floor of the mouth or the neck, or difficulty swallowing or breathing",
        "Bleeding that will not stop",
        "A jaw that has locked open or shut",
      ],
      research: [
        {
          authors: "Dutta A. et al.",
          title:
            "Design of porous titanium scaffold for complete mandibular reconstruction: the influence of pore architecture parameters",
          journal: "Computers in Biology and Medicine",
          year: "2019",
          doi: "10.1016/j.compbiomed.2019.03.004",
        },
        {
          authors: "Kapat K. et al.",
          title:
            "Simultaneous hydrothermal bioactivation with nano-topographic modulation of porous titanium alloy towards enhanced osteogenic and antimicrobial responses",
          journal: "Journal of Materials Chemistry B",
          year: "2018",
          doi: "10.1039/c8tb00382c",
        },
        {
          authors: "Chakraborty R. et al.",
          title:
            "MWCNT reinforced bone like calcium phosphate hydroxyapatite composite coating developed through pulsed electrodeposition",
          journal: "Surface and Coatings Technology",
          year: "2017",
          doi: "10.1016/j.surfcoat.2017.06.073",
        },
      ],
      gallery: [
        {
          src: "/images/facility/theatre.jpg",
          alt: "A surgical team at work in an operating theatre",
        },
        {
          src: "/images/dept/facio-1.jpg",
          alt: "Surgeons operating under theatre lights",
        },
      ],
    },
  },
  {
    match: /biochem/i,
    info: {
      summary:
        "The laboratory discipline that measures the chemistry of blood and of other body fluids.",
      body: [
        "Biochemistry does not hold a clinic of its own in the way the others do. Its tests are what the rest of the hospital works from — the sugar reading that confirms diabetes, the numbers that say how the kidneys and the liver are managing, the values that show whether a treatment is working.",
        "Samples are collected on the request of a consultant in another department, and the result goes back to whoever asked for it.",
      ],
      seenHere: [
        "Blood sugar and diabetic monitoring",
        "Kidney and liver function",
        "Lipid and cholesterol profiles",
        "Thyroid function",
        "Electrolytes",
        "Monitoring of ongoing treatment",
      ],
      conditions: [
        {
          name: "Blood sugar and HbA1c",
          note: "Diagnoses diabetes, and shows how well it has been controlled over the past three months.",
        },
        {
          name: "Liver function tests",
          note: "A panel of enzymes and proteins showing whether the liver is inflamed, blocked or failing.",
        },
        {
          name: "Kidney function tests",
          note: "Urea, creatinine and electrolytes, showing how well the kidneys are clearing waste.",
        },
        {
          name: "Lipid profile",
          note: "Cholesterol and triglycerides, used to judge the risk to the heart and arteries.",
        },
        {
          name: "Thyroid function tests",
          note: "Hormone levels showing a gland working too hard or too little.",
        },
        {
          name: "Electrolytes",
          note: "Sodium, potassium and calcium, small shifts of which affect the heart, the muscles and consciousness.",
        },
      ],
      visit: [
        "You do not consult a biochemist. The department receives samples taken elsewhere in the hospital and reports on them.",
        "A blood sample is taken at the collection counter, usually from a vein in the arm, and takes under a minute.",
        "Some tests need you to have eaten nothing for eight to twelve hours. The request form will say so, and water is allowed.",
        "Results are reported against a reference range for your age and sex. A figure slightly outside that range is common, and is read alongside everything else rather than on its own.",
        "The report goes to the doctor who requested it, and is explained to you at your next visit.",
      ],
      tests: [
        "Blood sugar, fasting and after a meal",
        "HbA1c",
        "Liver function tests",
        "Kidney function tests and electrolytes",
        "Lipid profile",
        "Thyroid function tests",
      ],
      research: [
        {
          authors: "Dutta G., Lillehoj P. B.",
          title:
            "Wash-free, label-free immunoassay for rapid electrochemical detection of PfHRP2 in whole blood samples",
          journal: "Scientific Reports",
          year: "2018",
          doi: "10.1038/s41598-018-35471-8",
        },
        {
          authors: "Awasthi K. et al.",
          title:
            "Impedimetric blood pH sensor based on MoS2 Nafion coated microelectrode",
          journal: "RSC Advances",
          year: "2016",
          doi: "10.1039/c6ra17786g",
        },
        {
          authors: "Dutta G. et al.",
          title:
            "Commercially fabricated printed circuit board sensing electrodes for biomarker electrochemical detection",
          journal: "Proceedings",
          year: "2018",
          doi: "10.3390/proceedings2130741",
        },
      ],
      gallery: [
        {
          src: "/images/dept/biochemistry-1.jpg",
          alt: "A blood sample being loaded into a clinical chemistry analyser",
        },
        {
          src: "/images/facility/laboratory.jpg",
          alt: "Technicians working at benches in a hospital laboratory",
        },
        {
          src: "/images/facility/lab10.jpg",
          alt: "A bench-top laboratory analyser at this hospital",
        },
      ],
    },
  },
  {
    match: /patholog|microbiolog|haematolog|hematolog/i,
    info: {
      summary: "The laboratory study of disease.",
      body: [
        "Pathologists examine blood, tissue and other samples under the microscope and by other means to establish what a condition is, and to follow how it is answering to treatment. A diagnosis that a clinician suspects is very often confirmed or ruled out here.",
        "Like biochemistry, the department works on request from the rest of the hospital rather than seeing patients in a clinic of its own.",
      ],
      seenHere: [
        "Blood counts",
        "Examination of tissue samples",
        "Culture and sensitivity testing",
        "Screening for infection",
        "Confirmation of a suspected diagnosis",
        "Monitoring during treatment",
      ],
      conditions: [
        {
          name: "Complete blood count",
          note: "The numbers and shapes of red cells, white cells and platelets — the single most useful test in medicine.",
        },
        {
          name: "Anaemia workup",
          note: "Establishes whether low haemoglobin is from iron, from blood loss, or from the marrow itself.",
        },
        {
          name: "Infection screening",
          note: "Finding the organism behind a fever, and which antibiotic will actually work against it.",
        },
        {
          name: "Urine examination",
          note: "Detects infection, kidney disease and diabetes, from a sample you provide yourself.",
        },
        {
          name: "Histopathology",
          note: "Tissue removed at operation or biopsy, examined under the microscope to establish exactly what it is.",
        },
        {
          name: "Cytology",
          note: "Examination of individual cells, used in screening and to investigate a lump or a fluid.",
        },
      ],
      visit: [
        "You do not consult a pathologist. The department examines samples and reports on them to the doctor treating you.",
        "Blood is taken at the collection counter. Urine and other samples are handed in there, in the container provided.",
        "Routine reports are usually available the same day or the next. Cultures take longer, because the organism has to be grown before it can be identified — two to three days is normal and is not a delay.",
        "Tissue examined under the microscope takes longer still, and is reported to the surgeon who removed it.",
      ],
      tests: [
        "Complete blood count",
        "Peripheral smear examination",
        "Erythrocyte sedimentation rate",
        "Urine routine and microscopy",
        "Culture and antibiotic sensitivity",
        "Histopathology and cytology",
      ],
      research: [
        {
          authors: "Rahaman M. et al.",
          title:
            "Exploring the crosstalk between long non-coding RNAs and microRNAs to unravel potential prognostic and therapeutic biomarkers in beta-thalassemia",
          journal: "Molecular Biology Reports",
          year: "2022",
          doi: "10.1007/s11033-022-07629-1",
        },
        {
          authors: "Das S., Chakravorty N.",
          title:
            "Identification of deleterious SNPs and their effects on BCL11A, the master regulator of fetal hemoglobin expression",
          journal: "Genomics",
          year: "2019",
          doi: "10.1016/j.ygeno.2019.03.002",
        },
        {
          authors: "Das S. et al.",
          title:
            "Integrative microRNA and gene expression analysis identifies new drug repurposing candidates for fetal hemoglobin induction",
          journal: "Gene",
          year: "2019",
          doi: "10.1016/j.gene.2019.04.077",
        },
      ],
      gallery: [
        {
          src: "/images/dept/pathology-1.jpg",
          alt: "Pathologists working at microscopes",
        },
        {
          src: "/images/facility/lab8.jpg",
          alt: "An automated culture instrument at this hospital",
        },
        {
          src: "/images/facility/lab1.jpg",
          alt: "A technician at work in the laboratory at this hospital",
        },
      ],
    },
  },
];

export function departmentInfo(name: string): DepartmentInfo | null {
  return INFO.find((entry) => entry.match.test(name))?.info ?? null;
}

export type ResearchPaper = NonNullable<DepartmentInfo["research"]>[number];

/** Every paper listed under any department, newest first, each DOI once. */
export function allResearch(): ResearchPaper[] {
  const seen = new Set<string>();
  const papers: ResearchPaper[] = [];
  for (const entry of INFO) {
    for (const paper of entry.info.research ?? []) {
      if (seen.has(paper.doi)) continue;
      seen.add(paper.doi);
      papers.push(paper);
    }
  }
  return papers.sort((a, b) => b.year.localeCompare(a.year));
}

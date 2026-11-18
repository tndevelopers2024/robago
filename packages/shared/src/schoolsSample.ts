// src/schoolsSample.ts
//
// 1. SCHOOL_VISITS_SAMPLE — the schools the team has already visited, copied from the client's "school database.xlsx".
// 2. SCHOOL_PROSPECTS_SAMPLE — other private (CBSE / ICSE / Matriculation) schools in the same districts, collected from
//    public school directories (Careers360, Lentlo, Zigya, Creta Class, Wikipedia lists). Names and towns only: boards
//    and details come from those directories and are UNVERIFIED — confirm each on the CBSE / CISCE sites before visiting.
import { SchoolBoard, SchoolStage } from "./enums.js";

type Board = SchoolBoard;
type Stage = Exclude<SchoolStage, "prospect">;

export interface SchoolVisitSampleRow {
    name: string;
    district: string;
    place: string;
    board: Board;
    studentCount: number | null;
    studentNote: string;
    correspondent: string;
    metWith: string;
    phone: string;
    reference: string;
    notes: string;
    /** YYYY-MM-DD */
    date: string;
    outcome: string;
    stage: Stage;
}

const R = (
    date: string,
    name: string,
    district: string,
    place: string,
    board: Board,
    students: number | null,
    studentNote: string,
    correspondent: string,
    metWith: string,
    phone: string,
    reference: string,
    stage: Stage,
    outcome: string,
    notes = "",
): SchoolVisitSampleRow => ({
    name, district, place, board, studentCount: students, studentNote, correspondent, metWith, phone, reference, notes, date, outcome, stage,
});

const B = SchoolBoard;
const MANI = "Mr.Mani-Chalo";

export const SCHOOL_VISITS_SAMPLE: SchoolVisitSampleRow[] = [
    R("2026-10-06", "Vijay Kids CBSE & Matric", "Dharmapuri", "Dharmapuri", B.CBSE, 10500, "", "", "Mr.Srinivasan - Purchase Head", "9791565534", "Mr.Maruthu Pandi - Vinoth Friend", "negotiating", "Last year we did 1600 (2025-26) and now we expect, along with CBSE, 4000 nos."),
    R("2026-10-06", "Sriram School", "Dharmapuri", "Dharmapuri", B.Other, 4000, "", "Mr.Tamilmani", "", "9487567209", "Mr.Anis - Kanakadasa owner", "sampled", "Showed sample. Not giving bags as of now. November 2nd week: need to call / meet while going there."),
    R("2026-10-08", "Sabarmathi Vidyalaya", "Ariyalur", "Ariyalur", B.Other, 1500, "", "Mr.Ramesh", "", "9655775353", MANI, "sampled", "Showed sample and quotation sent. They are giving normal bags."),
    R("2026-10-08", "Chola International", "Thanjavur", "Thanjavur", B.Other, 200, "", "", "MD, Mrs.Pradeepa", "6385745637", MANI, "negotiating", "Near confirmation."),
    R("2026-10-08", "RSKV International", "Tiruchirappalli", "Thuraiyur", B.Other, 700, "", "", "", "9677364333", MANI, "visited", "This is the reception contact. Need to talk and get an appointment."),
    R("2026-10-08", "Ramakrishna Vidyalaya", "Perambalur", "Perambalur", B.Other, null, "", "", "", "", "", "visited", "Didn't meet the Principal."),
    R("2026-10-08", "Sathya Saai", "Perambalur", "Perambalur (20 km towards Chennai)", B.Matric, 5000, "", "", "Matric Principal", "", "Own with Mani", "visited", "Need to meet the chairman and talk. Send mail."),
    R("2026-10-13", "Sir Issac Newton", "Nagapattinam", "Nagapattinam", B.Other, 1500, "", "Mr.Shankar", "", "9003757537", MANI, "confirmed", "50 pcs order came. Big school, payment takes 5 to 6 months. Need to ask for a further order. Meet them in January."),
    R("2026-10-13", "Chinmayi Vidyalaya", "Nagapattinam", "Nagapattinam", B.Other, null, "", "", "", "", "CSMA-Event", "visited", "Need to talk with the MD. Not a good meeting with the VP."),
    R("2026-10-13", "Cavery School", "Nagapattinam", "Nagapattinam", B.Other, null, "", "", "", "", "Cold Call", "lost", "School bags: not giving."),
    R("2026-10-14", "Alagu Jothi School", "Mayiladuthurai", "Mayiladuthurai", B.Other, 2000, "", "Mr.Adthi", "", "9677565222", "Yuvraj and later Bala - Chalo support", "sampled", "They are giving Wildcraft - satisfied with price & quality. Waiting for order."),
    R("2026-10-14", "Goods Smarton", "Mayiladuthurai", "Mayiladuthurai", B.Other, null, "", "", "", "", "Cold Call", "lost", "Only jute bags."),
    R("2026-10-14", "Subam Vidya Mandir", "Mayiladuthurai", "Mayiladuthurai", B.Other, null, "", "Mr.Sudeesh", "", "9994350501", MANI, "visited", "Need to call the MD."),
    R("2026-10-14", "Shemford School", "Cuddalore", "Chidambaram", B.Other, 600, "", "Mr.Hari", "", "6385891560", "Mr.Mani-Chalo - His Professor", "confirmed", "Order confirmed: 3 size bag. Sample couriered. 600 nos."),
    R("2026-10-15", "Krishnasammy School - CBSE & Matric", "Cuddalore", "Cuddalore", B.CBSE, 5000, "", "", "Mr.Srinivasan - Purchase Head", "9444186625", MANI, "visited", "Giving 3 size backpack. Need to get an appointment to meet Madam (MD)."),
    R("2026-10-01", "Jayendra Saraswati", "Villupuram", "Villupuram", B.Other, 3000, "", "Mr.Paranav", "", "9976948254", "Mr.Bala Chalo", "sampled", "Giving PVC backpack. Gave sample. Have a big mall: need to talk with them in November. Number of their PA: Mr.Sasti Kannan.", "Date in the sheet reads 10/1/26 — please check."),
    R("2026-10-01", "Holy Angel", "Villupuram", "Villupuram", B.Other, 1500, "", "Mr.Palaniyappan", "", "9443137315", "Mr.Rajasekar BDM", "negotiating", "Almost order confirm. President of the Private School Association for Villupuram.", "Date in the sheet reads 10/1/26 — please check."),
    R("2026-10-01", "Shanthanam International", "Tiruchirappalli", "Trichy", B.Other, 1500, "", "", "Mrs.Rekha", "7373968168", "Mr.Yuvraj", "sampled", "Gave 4 size sample. Eager to give order. Need to follow up.", "Date in the sheet reads 10/1/26 — please check."),
    R("2026-10-27", "Shree Balani Keythaan", "Salem", "Salem", B.Other, 150, "", "Mrs.Vedhana", "", "9445552720", MANI, "sampled", "Buying bags from Mumbai. Sent them a quote: K-370 & S-470."),
    R("2026-10-27", "Sami Matric", "Salem", "Salem", B.Matric, 3000, "", "", "Mr.Sasi Kumar - AO", "9894637220", MANI, "lost", "They are a trust and not giving bags. If you want, can put up a stall."),
    R("2026-10-27", "Amala Group of Schools (Matric & CBSE)", "Salem", "Edappadi", B.CBSE, null, "350 & 1000", "", "Mr.Sathish - AO", "9442700829", MANI, "lost", "Gave bags and had a bad experience. Their MD has good connections with big schools like PAAVI, SRV Namakkal, Green Park Namakkal & ECR Kallakurichi."),
    R("2026-10-28", "National Public School", "Namakkal", "Namakkal", B.Other, 6000, "6000 kids & 1100 …", "Srinivasan", "Mr.Chinnasammi", "Chinasami 9865611333 · Srinivasan 9443369698", "CSMA-Event", "visited", "They have 120 kids' schools across India with 6000 students and 1 own school."),
    R("2026-10-28", "Spectrum Matric and CBSE", "Namakkal", "Namakkal", B.CBSE, 2500, "2500+", "Anipriya", "MD's wife and AO", "Anipriya 9790060903 · Ravi Pandian 8637622629", "Cold Call", "sampled", "They are giving Wildcraft - satisfied with our price & quality. Need to meet the MD."),
    R("2026-10-28", "Green Park", "Namakkal", "Namakkal", B.Other, 3000, "3000+", "", "", "", "Cold Call", "visited", "Need to meet Anitha Mam (principal). Need to meet after Deepawali."),
    R("2026-10-29", "Arise International School", "Salem", "Salem", B.Other, 850, "", "", "AO - Sasikumar", "9150097984", MANI, "sampled", "Will show to Management and call us back. They are giving bags — have an issue with them."),
    R("2026-10-29", "SBIOA", "Salem", "Salem", B.Other, 5000, "5000+", "", "", "", "Cold Call", "visited", "Need to meet their HO in Chennai."),
    R("2026-10-29", "Highbro", "Salem", "", B.Other, 75, "", "Mr.Kiran", "", "7904672980", "CMSA", "visited", "New school. Consultant for a few schools.", "No place in the sheet — district assumed Salem, please check."),
    R("2026-10-29", "ECR Matric and CBSE School", "Kallakurichi", "Kallakurichi", B.CBSE, 4500, "4500+", "Ravikumar & Sakthi", "", "Sakthi 76395 33555 · Ravikumar 97876 87795", "Cold Call", "visited", "Need to meet them after Deepawali."),
    R("2026-10-29", "J S Global", "Kallakurichi", "Kallakurichi", B.Other, 3000, "3000+", "", "Mrs.Kavitha - Incharge", "Kavitha 96770 06670", "Cold Call", "sampled", "Quotation sent. Need to meet their MD."),
    R("2026-11-04", "Saraswathi MHSS", "Villupuram", "Villupuram", B.Matric, 3300, "3300+", "Mr.Sekar", "", "", "Mr.Rajasekar - BDM - Palaniyappan", "lost", "They are a trust and not giving bags."),
    R("2026-11-04", "VRP School", "Villupuram", "Villupuram", B.Other, 1600, "", "Mr.Cholan", "", "9787777066", "Mr.Rajasekar - BDM - Palaniyappan", "visited", "Need to give a quotation. Said good pay master."),
    R("2026-11-04", "John Dewey School", "Villupuram", "Villupuram", B.Other, 3000, "3000+", "", "Mr.Robin - AO", "9865546688", "Mr.Rajasekar - BDM - Palaniyappan", "visited", "They are giving local bags from Pondicherry. Only for kids. 3 branches."),
    R("2026-11-04", "Sri Krishna MHSS", "Villupuram", "Villupuram (31 km)", B.Matric, 1500, "", "Mr.Sekar", "", "", "Mr.Rajasekar - BDM - Palaniyappan", "visited", "Need to meet them."),
    R("2026-11-04", "Vivekanda School", "Villupuram", "Manampoondi", B.Other, 7000, "7000+ · 3 schools", "Mr.Murugan", "Mr.Gokul", "Gokul 7502902666", "Mr.Rajasekar - BDM - Palaniyappan", "visited", "Need to meet them after Deepawali."),
];

export interface SchoolProspectSampleRow {
    name: string;
    district: string;
    place: string;
    board: Board;
}

const P = (district: string, place: string, board: Board, ...names: string[]): SchoolProspectSampleRow[] =>
    names.map((name) => ({ name, district, place, board }));

/** Private schools (no government schools) found in public directories. Board labels are as those directories give them. */
export const SCHOOL_PROSPECTS_SAMPLE: SchoolProspectSampleRow[] = [
    ...P("Dharmapuri", "Dharmapuri", B.CBSE, "Advaith International Academy", "Avvai Vidhyashram Public School", "Litera Valley Zee School", "Maharishi Vidya Mandir", "Nalanda International Public School", "Open Arms Matriculation School", "Sassi Gnanodaya Academy", "Vailankanni Public School", "Sri Vijay Vidyashram"),
    ...P("Dharmapuri", "Harur", B.CBSE, "Indian Public School"),
    ...P("Dharmapuri", "Dharmapuri", B.Matric, "Sri Bhakiyam Vidhyalaya", "Auxilium Matriculation School", "Dawn Matriculation Higher Secondary School", "Carmel Matriculation School"),
    ...P("Ariyalur", "Jayankondam", B.CBSE, "Sowdambikaa Vidyalaya", "PM Public School"),
    ...P("Ariyalur", "Ariyalur", B.CBSE, "Mahatma Public School", "The Aditya Birla Public School (Reddipalayam)"),
    ...P("Ariyalur", "Ariyalur", B.Matric, "Vidya Mandir Matriculation Higher Secondary School", "Montfort Matric Higher Secondary School", "Swami Matriculation Higher Secondary School"),
    ...P("Ariyalur", "Sendurai", B.Other, "Ramco Vidyalaya"),
    ...P("Thanjavur", "Thanjavur", B.CBSE, "Thamarai International School"),
    ...P("Tiruvarur", "Mannargudi", B.CBSE, "ARJ Public School", "Concordia Public School (Melakadu)"),
    ...P("Thanjavur", "Pattukkottai", B.CBSE, "Laurel Secondary School"),
    ...P("Thanjavur", "Kumbakonam", B.CBSE, "Dr. GS Kalyanasundaram Memorial School", "National Vidyalaya", "Heritage Public School (Vrindavan)", "Thamarai International School (Kumbakonam)"),
    ...P("Thanjavur", "Thanjavur", B.Matric, "Sai Ram Matriculation Higher Secondary School", "Gandhi Matriculation Higher Secondary School", "Sri Aravindar Matriculation Higher Secondary School"),
    ...P("Tiruchirappalli", "Trichy", B.CBSE, "Kendriya Vidyalaya No. 1 (Ordnance Estate)", "Sri Chaitanya Techno School", "Sowdambikaa Vidyalaya", "Orchard School (K.K. Nagar)", "MAM Matriculation Higher Secondary School (Siruganur)"),
    ...P("Tiruchirappalli", "Trichy", B.ICSE, "Kamakoti Vidyalaya", "St. Mary's Middle School (Woraiyur)"),
    ...P("Tiruchirappalli", "Trichy", B.Matric, "Good Shepherd Matriculation School (K.K. Nagar)", "Santa Maria Matriculation Higher Secondary School (Pudur)", "Mannar Memorial Matric School (Cantonment)", "Seventh-day Adventist Matriculation Higher Secondary School (Beeman Nagar)"),
    ...P("Tiruchirappalli", "Trichy", B.Other, "Bishop Heber Higher Secondary School (Teppakulam)", "Akara World School (K.K. Nagar)"),
    ...P("Perambalur", "Perambalur", B.CBSE, "Hans Roever Public School", "Kendriya Vidyalaya Perambalur"),
    ...P("Perambalur", "Karuppur", B.CBSE, "Vinayaga Public School"),
    ...P("Perambalur", "Perambalur", B.Matric, "Sri Ramakrishna Girls' Matriculation Higher Secondary School", "St. Joseph's Matriculation Higher Secondary School", "Green Park Matriculation Higher Secondary School", "Golden Gates Matriculation Higher Secondary School", "Thanthai Roever Matriculation Higher Secondary School"),
    ...P("Nagapattinam", "Vedaranyam", B.CBSE, "Sivasakthi International School"),
    ...P("Nagapattinam", "Vedaranyam", B.Other, "Point Calimere International School"),
    ...P("Nagapattinam", "Nagapattinam", B.CBSE, "Alagu Jothi Academy", "Amrita Vidyalayam (Vadakudi Road)"),
    ...P("Mayiladuthurai", "Mayiladuthurai", B.CBSE, "Everest KenBridge Senior Secondary School", "AJA Gurukulam School", "Golden Public School"),
    ...P("Cuddalore", "Vridhachalam", B.CBSE, "KSR Hitech School"),
    ...P("Cuddalore", "Srimushnam", B.CBSE, "SBG Vidhyalaya"),
    ...P("Cuddalore", "Chidambaram", B.CBSE, "Edison G Agoram Memorial School (Manalur)", "Oxford English School"),
    ...P("Cuddalore", "Neyveli", B.CBSE, "Seventh Day Adventist School", "Kendriya Vidyalaya Neyveli"),
    ...P("Cuddalore", "Cuddalore", B.CBSE, "Narayana e-Techno School"),
    ...P("Cuddalore", "Cuddalore", B.Matric, "Savior Jesus Matriculation Higher Secondary School"),
    ...P("Cuddalore", "Chidambaram", B.Matric, "Nirmala Matriculation Higher Secondary School"),
    ...P("Cuddalore", "Neyveli", B.Matric, "St. Paul Matriculation Higher Secondary School"),
    ...P("Cuddalore", "Neyveli", B.Other, "Jawahar Higher Secondary School", "SRK International School", "St. Joseph of Cluny Public School"),
    ...P("Villupuram", "Tindivanam", B.CBSE, "Holy Angel School (Tindivanam)"),
    ...P("Villupuram", "Omandur", B.CBSE, "Shri Ram School", "V.K.M. Vidhyalaya"),
    ...P("Villupuram", "Villupuram", B.CBSE, "St. Jean English Medium School (College Nagar)", "Villupuram Vidyalaya International School (Kappiampuliyur)"),
    ...P("Villupuram", "Gingee", B.CBSE, "Sri Sairam Public School"),
    ...P("Villupuram", "V. Maruthur", B.CBSE, "Sacred Heart Central School"),
    ...P("Villupuram", "Thiruvandarkoil", B.CBSE, "Santhamani English High School"),
    ...P("Villupuram", "Tindivanam", B.Matric, "Mary's Matriculation Higher Secondary School"),
    ...P("Salem", "Attur", B.CBSE, "Classic Matriculation School", "Vivekananda Kendriya Vidyalaya Matriculation School"),
    ...P("Salem", "Attur", B.Matric, "Saraswathi Matric Higher Secondary School", "Tagore Matriculation Higher Secondary School", "Bharat Matriculation Higher Secondary School"),
    ...P("Salem", "Edappadi", B.Matric, "Wisdom Matriculation Higher Secondary School", "Universal Matriculation Higher Secondary School", "St. Mary's Matriculation School (Vellandivalasu)"),
    ...P("Namakkal", "Tiruchengode", B.CBSE, "Narayana e-Techno School", "SKV Matriculation and Higher Secondary School (M. Kandampalayam)", "SPK Matriculation Higher Secondary School", "Vidyaa Vikas International School", "Vriksha Global School", "The Meridian International School"),
    ...P("Namakkal", "Rasipuram", B.CBSE, "Rasi International School"),
    ...P("Namakkal", "Rasipuram", B.Matric, "SRV Excel Matriculation Higher Secondary School"),
    ...P("Namakkal", "Namakkal", B.CBSE, "Dr. MSU Murthy School of Excellence"),
    ...P("Namakkal", "Namakkal", B.Other, "Mahendra International School (Kalippatti)"),
    ...P("Kallakurichi", "Kallakurichi", B.CBSE, "Velammal Bodhi Campus", "AKT Memorial Vidya Saaket School"),
    ...P("Kallakurichi", "Kallakurichi", B.Matric, "Bharathi Matriculation Higher Secondary School", "Sakthi Matric Higher Secondary School"),
    ...P("Kallakurichi", "Thatchur", B.Other, "Oxaliss International School"),
    ...P("Kallakurichi", "Kallakurichi", B.Other, "Mahabharathi International School"),
    // ---- neighbouring districts (to suggest as the next stop) ----
    ...P("Krishnagiri", "Hosur", B.CBSE, "Narayana e-Techno School (Bagalur Road)", "Maharishi Vidya Mandir Senior Secondary School", "Sri Chaitanya Techno School", "Alpha Elite High (Bagalur)", "Sri Vijay Vidyashram (Bagalur)", "Green Valley School", "BMR Global School", "Brundavana School", "Siddarth Village School", "Swathy Matriculation Higher Secondary School (Onnalvadi)"),
    ...P("Krishnagiri", "Krishnagiri", B.CBSE, "Nalanda International Public School & Junior College", "Eternal Light Public School", "AVS Global School"),
    ...P("Krishnagiri", "Krishnagiri", B.Matric, "Sri Vijay Vidyalaya Matriculation Higher Secondary School"),
    ...P("Krishnagiri", "Thally", B.CBSE, "Santa Maria Academy"),
    ...P("Krishnagiri", "Bargur", B.CBSE, "Vailankanni Public School"),
    ...P("Tiruvannamalai", "Arani", B.CBSE, "Orange British Academy", "Kannammal International School", "Shri Ramachandra School"),
    ...P("Tiruvannamalai", "Cheyyar", B.CBSE, "Bright Public School", "All India Modern School"),
    ...P("Tiruvannamalai", "Tiruvannamalai", B.CBSE, "Narayana e-Techno School"),
    ...P("Tiruvannamalai", "Meyyur", B.CBSE, "Aqsa Public School"),
    ...P("Tiruvannamalai", "Kilnachipattu", B.CBSE, "SVM International School"),
    ...P("Tiruvannamalai", "Manjapoondi", B.CBSE, "Velammal Vidhyashram"),
    ...P("Tiruvannamalai", "Mallavadi", B.CBSE, "Vijay Vidya Mandir"),
    ...P("Vellore", "Katpadi", B.CBSE, "Sunbeam School", "Vision Vidyashram World School"),
    ...P("Vellore", "Katpadi", B.Matric, "Williams Matriculation Higher Secondary School"),
    ...P("Vellore", "Vellore", B.CBSE, "Ida Scudder School", "Vani Vidhayalaya School", "Kingston International Academy"),
    ...P("Vellore", "Vellore", B.Matric, "Vidyaniketan Matriculation Higher Secondary School", "Bethel Matriculation Higher Secondary School", "St. Marks Matriculation Higher Secondary School", "Cluny Matriculation Higher Secondary School"),
    ...P("Tirupathur", "Ambur", B.CBSE, "Future School"),
    ...P("Tirupathur", "Ambur", B.Other, "Takshila School"),
    ...P("Erode", "Perundurai", B.CBSE, "Maharaja Matriculation Higher Secondary School", "Nandha Matriculation Higher Secondary School", "Appichimar Vidhya Mandir Matriculation School"),
    ...P("Erode", "Perundurai", B.Matric, "Kongu Vellalar Matriculation Higher Secondary School"),
    ...P("Erode", "Perundurai", B.Other, "Vijay Vikas International School", "The Richmond Public School", "Spring Mount Valley School"),
    ...P("Erode", "Gobichettipalayam", B.CBSE, "Sri Venkateshwara International Senior Secondary School", "Diamond Jubilee Matriculation School"),
    ...P("Erode", "Erode", B.CBSE, "Narayana e-Techno School"),
    ...P("Karur", "Karur", B.CBSE, "Sri Chaitanya Techno School"),
    ...P("Karur", "Karur", B.Other, "Bharani Vidhyalaya", "Chettinad Vidya Mandir", "Pon Vidya Mandir", "Sita Rajaram Public School"),
    ...P("Pudukkottai", "Aranthangi", B.CBSE, "Doctors Public School", "Montfort School"),
    ...P("Pudukkottai", "Aranthangi", B.Other, "Sai Laurel International School"),
    ...P("Pudukkottai", "Vagavasal", B.Other, "MAI Skool"),
    ...P("Pudukkottai", "Illuppur", B.Other, "Vairams Public School"),
    ...P("Pudukkottai", "Kunnathur", B.Other, "SFS Public School"),
    ...P("Pudukkottai", "Mathur", B.Other, "Sacred Heart School"),
    ...P("Tiruvarur", "Tiruvarur", B.CBSE, "Kendriya Vidyalaya (CUTN Campus)"),
    ...P("Tiruvarur", "Thiruthuraipoondi", B.Other, "SVS International School"),
    ...P("Dindigul", "Palani", B.CBSE, "Shri Vidhya Mandhir", "Holy Cross School"),
    ...P("Dindigul", "Palani", B.Other, "John Paul Higher Secondary School"),
    ...P("Dindigul", "Oddanchatram", B.CBSE, "Akshaya Academy"),
    ...P("Dindigul", "Dindigul", B.CBSE, "Om Shanthi CBSE Higher Secondary School"),
];

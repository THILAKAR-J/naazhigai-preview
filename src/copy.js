'use strict';
// Page copy: title (≤ 65 chars before the brand), h1, meta description, lead and FAQs. {y} year, {c} city.
const C = {
  home: {
    en: { title: 'Tamil Calendar {y} – Today’s Panchangam & Nalla Neram', h1: 'Tamil Calendar {y}: <mark>today’s panchangam</mark>', desc: 'Tamil Calendar {y} for {c}: today’s Nalla Neram, Rahu Kalam, Yamagandam, tithi, nakshatram, muhurtham dates, viratham days, festivals and holidays.', lead: 'Nalla Neram, Rahu Kalam, tithi, nakshatram and soolam for {c}. Read the day in five seconds, plan the year in five minutes.' },
    ta: { title: 'தமிழ் காலண்டர் {y} – இன்றைய பஞ்சாங்கம், நல்ல நேரம்', h1: 'தமிழ் காலண்டர் {y}: <mark>இன்றைய பஞ்சாங்கம்</mark>', desc: '{c} நகருக்கான தமிழ் காலண்டர் {y}: இன்றைய நல்ல நேரம், ராகு காலம், எமகண்டம், திதி, நட்சத்திரம், முகூர்த்த நாட்கள், விரதங்கள், பண்டிகைகள், விடுமுறைகள்.', lead: '{c} நகருக்கான நல்ல நேரம், ராகு காலம், திதி, நட்சத்திரம், சூலம் – ஒரே பார்வையில். ஆண்டு முழுவதையும் சில நிமிடங்களில் திட்டமிடுங்கள்.' },
    faq: {
      en: [['What is Rahu Kalam?', 'A daily window of one and a half hours, fixed by weekday, that is traditionally avoided for starting new work. On Tuesdays it is 3:00 PM – 4:30 PM.'], ['What is Nalla Neram?', 'Nalla Neram means “good time”: the hours of the day considered favourable for beginnings such as travel, purchases or signing papers.'], ['What is the difference between Valarpirai and Theipirai?', 'Valarpirai is the waxing fortnight, from Amavasai to Pournami. Theipirai is the waning fortnight, from Pournami to Amavasai.'], ['Which city are these timings for?', 'Sunrise, sunset, Gowri Panchangam and Nalla Neram are calculated for {c}. Rahu Kalam, Yamagandam and Kuligai follow the traditional fixed table used in Tamil calendars.']],
      ta: [['ராகு காலம் என்றால் என்ன?', 'ஒவ்வொரு கிழமைக்கும் நிர்ணயிக்கப்பட்ட ஒன்றரை மணி நேரம்; புதிய காரியங்களைத் தொடங்க தவிர்க்கப்படும் நேரம். செவ்வாய்க்கிழமை மாலை 3:00 – 4:30.'], ['நல்ல நேரம் என்றால் என்ன?', 'பயணம், பொருள் வாங்குதல், ஒப்பந்தம் போன்ற புதிய தொடக்கங்களுக்கு உகந்ததாகக் கருதப்படும் நேரம்.'], ['வளர்பிறை, தேய்பிறை – வேறுபாடு என்ன?', 'அமாவாசை முதல் பௌர்ணமி வரை வளர்பிறை; பௌர்ணமி முதல் அமாவாசை வரை தேய்பிறை.'], ['இந்த நேரங்கள் எந்த நகருக்கு?', 'சூரிய உதயம், அஸ்தமனம், கௌரி பஞ்சாங்கம், நல்ல நேரம் ஆகியவை {c} நகருக்குக் கணக்கிடப்பட்டவை. ராகு காலம், எமகண்டம், குளிகை பாரம்பரிய நிலையான அட்டவணைப்படி.']]
    }
  },
  'tamil-daily-calendar': {
    en: { title: 'Tamil Daily Calendar {y} – Panchangam for Every Day', h1: 'Tamil Daily Calendar {y}', desc: 'Open the Tamil daily calendar for any day of {y}: Tamil date, tithi, nakshatram, Nalla Neram, Rahu Kalam, Gowri Panchangam and festivals for {c}.', lead: 'Pick a date to see its full panchangam. Every day of {y} has its own page.' },
    ta: { title: 'தமிழ் தினசரி காலண்டர் {y} – ஒவ்வொரு நாளுக்கும் பஞ்சாங்கம்', h1: 'தமிழ் தினசரி காலண்டர் {y}', desc: '{y} ஆண்டின் எந்த நாளுக்கும் தமிழ் தேதி, திதி, நட்சத்திரம், நல்ல நேரம், ராகு காலம், கௌரி பஞ்சாங்கம், பண்டிகைகள் – {c}.', lead: 'தேதியைத் தேர்ந்தெடுத்து முழு பஞ்சாங்கத்தையும் காணுங்கள். {y} ஆண்டின் ஒவ்வொரு நாளுக்கும் தனிப் பக்கம் உண்டு.' }
  },
  'tamil-monthly-calendar': {
    en: { title: 'Tamil Monthly Calendar {y} – All 12 Months', h1: 'Tamil Monthly Calendar {y}', desc: 'Tamil monthly calendar {y} with Tamil dates, tithi, muhurtham days, Pournami, Amavasai, viratham days and festivals for every month.', lead: 'Each month shows Tamil dates, tithi, muhurtham days, Pournami, Amavasai and festivals on one grid.' },
    ta: { title: 'தமிழ் மாத காலண்டர் {y} – 12 மாதங்களும்', h1: 'தமிழ் மாத காலண்டர் {y}', desc: 'தமிழ் தேதி, திதி, முகூர்த்த நாட்கள், பௌர்ணமி, அமாவாசை, விரதங்கள், பண்டிகைகளுடன் {y} மாத காலண்டர்.', lead: 'ஒவ்வொரு மாதமும் தமிழ் தேதி, திதி, முகூர்த்தம், பௌர்ணமி, அமாவாசை, பண்டிகைகளுடன் ஒரே அட்டவணையில்.' }
  },
  timings: {
    en: { title: 'Daily Timings {y} – Nalla Neram, Rahu Kalam, Kuligai', h1: 'Daily timings {y}', desc: 'All daily timings for {y} in one place: Nalla Neram, Gowri Nalla Neram, Rahu Kalam, Yamagandam, Kuligai Neram and Soolam with pariharam.', lead: 'Today’s timings first, then every timing page for the year.' },
    ta: { title: 'தினசரி நேரங்கள் {y} – நல்ல நேரம், ராகு காலம், குளிகை', h1: 'தினசரி நேரங்கள் {y}', desc: '{y} ஆண்டுக்கான அனைத்து நேரங்களும்: நல்ல நேரம், கௌரி நல்ல நேரம், ராகு காலம், எமகண்டம், குளிகை, சூலம் – பரிகாரம்.', lead: 'முதலில் இன்றைய நேரங்கள், பிறகு ஆண்டு முழுவதற்குமான பக்கங்கள்.' }
  },
  'nalla-neram': {
    en: { title: 'Nalla Neram {y} – Today’s Good Time, Day by Day', h1: 'Nalla Neram {y}', desc: 'Nalla Neram (good time) for every day of {y} in {c}: auspicious Gowri windows with Rahu Kalam and Yamagandam taken out. Today, tomorrow and the full year.', lead: 'The good hours of each day from sunrise to 10 PM, with Rahu Kalam and Yamagandam already removed.' },
    ta: { title: 'நல்ல நேரம் {y} – இன்றைய நல்ல நேரம், தினசரி', h1: 'நல்ல நேரம் {y}', desc: '{c} நகருக்கு {y} ஆண்டின் ஒவ்வொரு நாளுக்குமான நல்ல நேரம்: ராகு காலம், எமகண்டம் நீக்கப்பட்ட நல்ல கௌரி நேரங்கள். இன்று, நாளை, முழு ஆண்டு.', lead: 'சூரிய உதயம் முதல் இரவு 10 மணி வரை உள்ள நல்ல நேரங்கள்; ராகு காலம், எமகண்டம் ஏற்கனவே நீக்கப்பட்டுள்ளன.' },
    method: { en: 'Nalla Neram here is built from the Gowri Panchangam for {c}. We take the auspicious Gowri parts (Amirdham, Uthi, Laabam, Dhanam, Sugam) between sunrise and 10 PM, then remove Rahu Kalam and Yamagandam. Printed wall calendars sometimes list their own Nalla Neram, so the times can differ from those.', ta: 'இங்குள்ள நல்ல நேரம் {c} நகருக்கான கௌரி பஞ்சாங்கத்திலிருந்து கணக்கிடப்படுகிறது. சூரிய உதயம் முதல் இரவு 10 மணி வரை உள்ள நல்ல கௌரி பாகங்களை (அமிர்தம், உத்தி, லாபம், தனம், சுகம்) எடுத்து, ராகு காலம், எமகண்டம் நீக்கப்படுகின்றன. அச்சிட்ட காலண்டர்கள் தங்களுக்கென நல்ல நேரம் தருவதால் சில நேரங்களில் வேறுபாடு இருக்கலாம்.' },
    faq: {
      en: [['What is Nalla Neram today?', 'See the highlighted card at the top of this page. It always shows the current day for {c}.'], ['Why does Nalla Neram change every day?', 'It depends on sunrise and sunset, which shift through the year, and on the weekday’s Gowri sequence and its Rahu Kalam and Yamagandam.']],
      ta: [['இன்றைய நல்ல நேரம் என்ன?', 'இந்தப் பக்கத்தின் மேலே உள்ள அட்டை எப்போதும் {c} நகருக்கான இன்றைய நேரத்தைக் காட்டும்.'], ['நல்ல நேரம் ஏன் தினமும் மாறுகிறது?', 'சூரிய உதயம், அஸ்தமனம் ஆண்டு முழுவதும் மாறுவதாலும், கிழமைக்கேற்ற கௌரி வரிசை, ராகு காலம், எமகண்டம் ஆகியவற்றாலும்.']]
    }
  },
  'gowri-nalla-neram': {
    en: { title: 'Gowri Nalla Neram {y} – Gowri Panchangam, Day and Night', h1: 'Gowri Nalla Neram {y}', desc: 'Gowri Nalla Neram for every day of {y} in {c}: the auspicious Gowri Panchangam parts for day and night, calculated from local sunrise and sunset.', lead: 'The five good Gowri parts of each day and night: Amirdham, Uthi, Laabam, Dhanam and Sugam.' },
    ta: { title: 'கௌரி நல்ல நேரம் {y} – கௌரி பஞ்சாங்கம், பகல் & இரவு', h1: 'கௌரி நல்ல நேரம் {y}', desc: '{c} நகருக்கு {y} ஆண்டின் ஒவ்வொரு நாளுக்கும் கௌரி நல்ல நேரம்: பகல், இரவு நல்ல கௌரி பாகங்கள், உள்ளூர் சூரிய உதயம், அஸ்தமனப்படி.', lead: 'ஒவ்வொரு பகல், இரவின் ஐந்து நல்ல கௌரி பாகங்கள்: அமிர்தம், உத்தி, லாபம், தனம், சுகம்.' },
    method: { en: 'Day (sunrise to sunset) and night (sunset to next sunrise) are each divided into eight equal parts. Each weekday has its own Gowri order. Amirdham, Uthi, Laabam, Dhanam and Sugam are good; Rogam, Soram and Visham are avoided.', ta: 'பகல் (உதயம் முதல் அஸ்தமனம்), இரவு (அஸ்தமனம் முதல் மறுநாள் உதயம்) தலா எட்டு சம பாகங்கள். ஒவ்வொரு கிழமைக்கும் தனி கௌரி வரிசை. அமிர்தம், உத்தி, லாபம், தனம், சுகம் நல்லவை; ரோகம், சோரம், விஷம் தவிர்க்கப்படும்.' }
  },
  'rahu-kalam': {
    en: { title: 'Rahu Kalam {y} – Today’s Rahu Kalam Timing', h1: 'Rahu Kalam {y}', desc: 'Rahu Kalam timings for {y}: today’s Rahu Kalam, the weekday table and a date-by-date list for every month.', lead: 'Rahu Kalam is a 90-minute window each day, fixed by weekday. Avoid starting new work in it.' },
    ta: { title: 'ராகு காலம் {y} – இன்றைய ராகு காலம்', h1: 'ராகு காலம் {y}', desc: '{y} ராகு காலம்: இன்றைய ராகு காலம், கிழமை அட்டவணை, ஒவ்வொரு மாதத்துக்குமான தேதி வாரியான பட்டியல்.', lead: 'ராகு காலம் ஒவ்வொரு நாளும் கிழமைக்கேற்ப நிர்ணயிக்கப்பட்ட 90 நிமிடம். புதிய காரியங்களைத் தொடங்க வேண்டாம்.' },
    faq: { en: [['What is Rahu Kalam today?', 'The highlighted row and card show today’s Rahu Kalam. The weekday table below never changes.'], ['Is Rahu Kalam the same in every city?', 'Tamil calendars print the traditional fixed table, based on a 6:00 AM sunrise, which is what this page shows.']], ta: [['இன்றைய ராகு காலம் என்ன?', 'மஞ்சள் நிற வரிசையும் அட்டையும் இன்றைய ராகு காலத்தைக் காட்டும். கிழமை அட்டவணை மாறாது.'], ['ராகு காலம் எல்லா ஊருக்கும் ஒன்றா?', 'தமிழ் காலண்டர்கள் காலை 6 மணி உதயத்தை அடிப்படையாகக் கொண்ட பாரம்பரிய நிலையான அட்டவணையை அச்சிடுகின்றன; இந்தப் பக்கமும் அதையே காட்டுகிறது.']] }
  },
  yamagandam: {
    en: { title: 'Yamagandam {y} – Today’s Yamagandam Timing', h1: 'Yamagandam {y}', desc: 'Yamagandam timings for {y}: today’s Yamagandam, the weekday table and date-by-date lists for every month.', lead: 'Yamagandam is another daily 90-minute window to avoid for auspicious beginnings.' },
    ta: { title: 'எமகண்டம் {y} – இன்றைய எமகண்டம்', h1: 'எமகண்டம் {y}', desc: '{y} எமகண்டம்: இன்றைய எமகண்டம், கிழமை அட்டவணை, மாத வாரியான தேதிப் பட்டியல்.', lead: 'எமகண்டம் – சுப காரியங்களுக்குத் தவிர்க்க வேண்டிய மற்றொரு தினசரி 90 நிமிட நேரம்.' }
  },
  'kuligai-neram': {
    en: { title: 'Kuligai Neram {y} – Today’s Kuligai Timing', h1: 'Kuligai Neram {y}', desc: 'Kuligai Neram for {y}: today’s Kuligai, the weekday table and date-by-date lists for every month.', lead: 'Whatever is done in Kuligai is believed to repeat, so it suits recurring good work and is avoided for funerals and debts.' },
    ta: { title: 'குளிகை நேரம் {y} – இன்றைய குளிகை', h1: 'குளிகை நேரம் {y}', desc: '{y} குளிகை நேரம்: இன்றைய குளிகை, கிழமை அட்டவணை, மாத வாரியான தேதிப் பட்டியல்.', lead: 'குளிகையில் செய்வது மீண்டும் நிகழும் என்பது நம்பிக்கை; எனவே திரும்ப நிகழ வேண்டிய நல்ல காரியங்களுக்கு ஏற்றது.' }
  },
  'soolam-pariharam': {
    en: { title: 'Soolam & Pariharam {y} – Direction to Avoid by Weekday', h1: 'Soolam & Pariharam', desc: 'Soolam (direction to avoid travelling) and its pariharam (remedy) for each weekday, with today’s soolam highlighted.', lead: 'Soolam is the direction considered unlucky for starting a journey on a given weekday. If you must travel that way, take the pariharam before leaving.' },
    ta: { title: 'சூலம் & பரிகாரம் – கிழமை வாரியாக', h1: 'சூலம் & பரிகாரம்', desc: 'ஒவ்வொரு கிழமைக்கும் சூலம் (பயணம் தவிர்க்க வேண்டிய திசை), அதற்கான பரிகாரம். இன்றைய சூலம் சிறப்பிக்கப்பட்டுள்ளது.', lead: 'சூலம் – அந்தக் கிழமையில் பயணம் தொடங்கத் தவிர்க்க வேண்டிய திசை. அவசியம் என்றால் பரிகாரம் எடுத்துக்கொண்டு புறப்படுங்கள்.' }
  },
  'muhurtham-dates': {
    en: { title: 'Muhurtham Dates {y} – Wedding & Griha Pravesam Dates', h1: 'Muhurtham dates {y}', desc: 'All {n} muhurtham dates for {y} with Tamil date, pirai, tithi and nakshatram. Includes Subha Muhurtham, Valarpirai and Theipirai lists.', lead: 'All muhurtham dates for {y} for weddings, griha pravesam and other new beginnings.' },
    ta: { title: 'முகூர்த்த நாட்கள் {y} – திருமணம், கிரகப்பிரவேசம்', h1: 'முகூர்த்த நாட்கள் {y}', desc: '{y} ஆண்டின் {n} முகூர்த்த நாட்களும் தமிழ் தேதி, பிறை, திதி, நட்சத்திரத்துடன். சுப முகூர்த்தம், வளர்பிறை, தேய்பிறை பட்டியல்களும்.', lead: 'திருமணம், கிரகப்பிரவேசம் உள்ளிட்ட புதிய தொடக்கங்களுக்கான {y} முகூர்த்த நாட்கள்.' },
    method: { en: 'Muhurtham dates are the dates published in Tamil calendars for {y}. Families often fix the exact lagnam with their priest, so confirm the time before you print invitations.', ta: 'முகூர்த்த நாட்கள் {y} தமிழ் காலண்டர்களில் வெளியிடப்பட்டவை. சரியான லக்னத்தை குடும்ப புரோகிதரிடம் உறுதி செய்த பிறகு அழைப்பிதழ் அச்சிடுங்கள்.' },
    faq: { en: [['What is the difference between Muhurtham and Subha Muhurtham?', 'Subha Muhurtham marks the stronger dates, usually in Valarpirai, that families prefer for weddings.'], ['How many muhurtham dates are there in {y}?', 'This list has {n} dates, of which {s} are Subha Muhurtham.']], ta: [['முகூர்த்தம், சுப முகூர்த்தம் – வேறுபாடு என்ன?', 'சுப முகூர்த்தம் பொதுவாக வளர்பிறையில் வரும், திருமணத்துக்கு அதிகம் விரும்பப்படும் வலுவான நாட்கள்.'], ['{y}-இல் எத்தனை முகூர்த்த நாட்கள்?', 'இந்தப் பட்டியலில் {n} நாட்கள்; அவற்றில் {s} சுப முகூர்த்தம்.']] }
  },
  'subha-muhurtham-dates': {
    en: { title: 'Subha Muhurtham Dates {y}', h1: 'Subha Muhurtham dates {y}', desc: 'The {n} Subha Muhurtham dates of {y} with Tamil date, pirai, tithi and nakshatram.', lead: 'Only the Subha Muhurtham dates of {y}.' },
    ta: { title: 'சுப முகூர்த்த நாட்கள் {y}', h1: 'சுப முகூர்த்த நாட்கள் {y}', desc: '{y} ஆண்டின் {n} சுப முகூர்த்த நாட்கள் – தமிழ் தேதி, பிறை, திதி, நட்சத்திரத்துடன்.', lead: '{y} ஆண்டின் சுப முகூர்த்த நாட்கள் மட்டும்.' }
  },
  'valarpirai-muhurtham-dates': {
    en: { title: 'Valarpirai Muhurtham Dates {y}', h1: 'Valarpirai muhurtham dates {y}', desc: 'The {n} muhurtham dates of {y} that fall in Valarpirai (waxing moon), with Tamil date, tithi and nakshatram.', lead: 'Muhurtham dates in the waxing fortnight, preferred by many families.' },
    ta: { title: 'வளர்பிறை முகூர்த்த நாட்கள் {y}', h1: 'வளர்பிறை முகூர்த்த நாட்கள் {y}', desc: '{y} வளர்பிறையில் வரும் {n} முகூர்த்த நாட்கள் – தமிழ் தேதி, திதி, நட்சத்திரத்துடன்.', lead: 'பல குடும்பங்கள் விரும்பும் வளர்பிறை முகூர்த்த நாட்கள்.' }
  },
  'theipirai-muhurtham-dates': {
    en: { title: 'Theipirai Muhurtham Dates {y}', h1: 'Theipirai muhurtham dates {y}', desc: 'The {n} muhurtham dates of {y} that fall in Theipirai (waning moon), with Tamil date, tithi and nakshatram.', lead: 'Muhurtham dates in the waning fortnight.' },
    ta: { title: 'தேய்பிறை முகூர்த்த நாட்கள் {y}', h1: 'தேய்பிறை முகூர்த்த நாட்கள் {y}', desc: '{y} தேய்பிறையில் வரும் {n} முகூர்த்த நாட்கள் – தமிழ் தேதி, திதி, நட்சத்திரத்துடன்.', lead: 'தேய்பிறை முகூர்த்த நாட்கள்.' }
  },
  viratham: {
    en: { title: 'Viratham Days {y} – Pradosham, Sashti, Ekadasi, Shivaratri', h1: 'Viratham days {y}', desc: 'Every viratham day of {y} on one page: Pradosham, Sankatahara Chathurthi, Sashti, Karthigai, Chathurthi, Shivaratri, Thiruvonam, Ekadasi and Chandra Darshan.', lead: 'All fasting days of {y}, calculated for {c}, in date order.' },
    ta: { title: 'விரத நாட்கள் {y} – பிரதோஷம், சஷ்டி, ஏகாதசி, சிவராத்திரி', h1: 'விரத நாட்கள் {y}', desc: '{y} ஆண்டின் அனைத்து விரத நாட்களும்: பிரதோஷம், சங்கடஹர சதுர்த்தி, சஷ்டி, கார்த்திகை, சதுர்த்தி, சிவராத்திரி, திருவோணம், ஏகாதசி, சந்திர தரிசனம்.', lead: '{c} நகருக்குக் கணக்கிடப்பட்ட {y} ஆண்டின் அனைத்து விரத நாட்களும், தேதி வரிசையில்.' }
  },
  'pradosham-dates': {
    en: { title: 'Pradosham Dates {y} – Soma & Sani Pradosham', h1: 'Pradosham dates {y}', desc: 'All {n} Pradosham dates of {y} with pradosha kalam timings for {c}, including Soma Pradosham and Sani Pradosham.', lead: 'Pradosham falls on Trayodasi, twice a month. Shiva puja is done in pradosha kalam around sunset.' },
    ta: { title: 'பிரதோஷம் {y} – சோம, சனி பிரதோஷம்', h1: 'பிரதோஷ நாட்கள் {y}', desc: '{y} ஆண்டின் {n} பிரதோஷ நாட்களும் {c} பிரதோஷ கால நேரத்துடன்; சோம பிரதோஷம், சனி பிரதோஷம் உட்பட.', lead: 'மாதம் இருமுறை திரயோதசியில் பிரதோஷம். சூரிய அஸ்தமனத்தை ஒட்டிய பிரதோஷ காலத்தில் சிவ பூஜை.' },
    method: { en: 'The day is the one on which Trayodasi covers most of pradosha kalam (1½ hours before to 1½ hours after sunset in {c}).', ta: '{c} சூரிய அஸ்தமனத்துக்கு 1½ மணி முன் முதல் 1½ மணி பின் வரையிலான பிரதோஷ காலத்தில் திரயோதசி அதிகம் இருக்கும் நாள்.' }
  },
  'sankatahara-chaturthi-dates': {
    en: { title: 'Sankatahara Chathurthi Dates {y} with Moonrise', h1: 'Sankatahara Chathurthi {y}', desc: 'All {n} Sankatahara Chathurthi dates of {y} with moonrise time in {c}, including Angaraki Chathurthi.', lead: 'The monthly Ganesha fast on Theipirai Chathurthi. It ends after seeing the moon, so the moonrise time matters.' },
    ta: { title: 'சங்கடஹர சதுர்த்தி {y} – சந்திர உதய நேரத்துடன்', h1: 'சங்கடஹர சதுர்த்தி {y}', desc: '{y} ஆண்டின் {n} சங்கடஹர சதுர்த்தி நாட்களும் {c} சந்திர உதய நேரத்துடன்; அங்காரக சதுர்த்தி உட்பட.', lead: 'தேய்பிறை சதுர்த்தியில் மாதாந்திர விநாயகர் விரதம். சந்திர தரிசனத்துக்குப் பின் விரதம் முடியும்.' },
    method: { en: 'The day on which Theipirai Chathurthi is running at moonrise in {c}.', ta: '{c} சந்திர உதய நேரத்தில் தேய்பிறை சதுர்த்தி இருக்கும் நாள்.' }
  },
  'sashti-viratham-dates': {
    en: { title: 'Sashti Viratham Dates {y} – Skanda Sashti', h1: 'Sashti viratham {y}', desc: 'All {n} Valarpirai Sashti viratham dates of {y} for Lord Murugan, including Skanda Sashti (Soora Samharam).', lead: 'Murugan devotees fast on Valarpirai Shashti every month.' },
    ta: { title: 'சஷ்டி விரதம் {y} – கந்த சஷ்டி', h1: 'சஷ்டி விரத நாட்கள் {y}', desc: '{y} ஆண்டின் {n} வளர்பிறை சஷ்டி விரத நாட்கள் – கந்த சஷ்டி (சூரசம்ஹாரம்) உட்பட.', lead: 'முருக பக்தர்கள் ஒவ்வொரு மாதமும் வளர்பிறை சஷ்டியில் விரதம் இருப்பார்கள்.' },
    method: { en: 'The day on which Valarpirai Shashti is running at sunrise in {c}.', ta: '{c} சூரிய உதயத்தில் வளர்பிறை சஷ்டி இருக்கும் நாள்.' }
  },
  'karthigai-viratham-dates': {
    en: { title: 'Karthigai Viratham Dates {y} – Karthigai Deepam', h1: 'Karthigai viratham {y}', desc: 'All {n} monthly Karthigai (Krittika nakshatram) viratham dates of {y}, including Karthigai Deepam.', lead: 'Karthigai nakshatram comes once a month and is sacred to Murugan.' },
    ta: { title: 'கார்த்திகை விரதம் {y} – கார்த்திகை தீபம்', h1: 'கார்த்திகை விரத நாட்கள் {y}', desc: '{y} ஆண்டின் {n} மாதாந்திர கார்த்திகை நட்சத்திர விரத நாட்கள் – கார்த்திகை தீபம் உட்பட.', lead: 'மாதம் ஒருமுறை வரும் கார்த்திகை நட்சத்திரம் முருகனுக்கு உகந்தது.' },
    method: { en: 'The day on which Karthigai nakshatram is running at sunset in {c}, when the lamps are lit.', ta: '{c} சூரிய அஸ்தமனத்தில், தீபம் ஏற்றும் நேரத்தில், கார்த்திகை நட்சத்திரம் இருக்கும் நாள்.' }
  },
  'chaturthi-viratham-dates': {
    en: { title: 'Chathurthi Viratham Dates {y} – Vinayagar Chathurthi', h1: 'Chathurthi viratham {y}', desc: 'All {n} Valarpirai Chathurthi viratham dates of {y}, including Vinayagar Chathurthi.', lead: 'The monthly Ganesha fast on Valarpirai Chathurthi.' },
    ta: { title: 'சதுர்த்தி விரதம் {y} – விநாயகர் சதுர்த்தி', h1: 'சதுர்த்தி விரத நாட்கள் {y}', desc: '{y} ஆண்டின் {n} வளர்பிறை சதுர்த்தி விரத நாட்கள் – விநாயகர் சதுர்த்தி உட்பட.', lead: 'வளர்பிறை சதுர்த்தியில் மாதாந்திர விநாயகர் விரதம்.' },
    method: { en: 'The day on which Valarpirai Chathurthi covers the middle of the day (madhyahnam) in {c}.', ta: '{c} மதியப் பொழுதில் (மத்யாஹ்னம்) வளர்பிறை சதுர்த்தி இருக்கும் நாள்.' }
  },
  'shivaratri-dates': {
    en: { title: 'Shivaratri Dates {y} – Maha & Masa Shivaratri', h1: 'Shivaratri {y}', desc: 'All {n} Masa Shivaratri dates of {y} with nishita (midnight) time for {c}, including Maha Shivaratri.', lead: 'Masa Shivaratri falls on Theipirai Chaturdashi every month. The one in Masi is Maha Shivaratri.' },
    ta: { title: 'சிவராத்திரி {y} – மகா சிவராத்திரி, மாத சிவராத்திரி', h1: 'சிவராத்திரி நாட்கள் {y}', desc: '{y} ஆண்டின் {n} மாத சிவராத்திரி நாட்களும் {c} நிசி நேரத்துடன்; மகா சிவராத்திரி உட்பட.', lead: 'ஒவ்வொரு மாதமும் தேய்பிறை சதுர்த்தசியில் மாத சிவராத்திரி. மாசியில் வருவது மகா சிவராத்திரி.' },
    method: { en: 'The night on which Theipirai Chaturdashi is running at nishita, the midpoint between sunset and the next sunrise in {c}.', ta: '{c} சூரிய அஸ்தமனத்துக்கும் மறுநாள் உதயத்துக்கும் நடுவான நிசி நேரத்தில் தேய்பிறை சதுர்த்தசி இருக்கும் இரவு.' }
  },
  'thiruvonam-dates': {
    en: { title: 'Thiruvonam Viratham Dates {y}', h1: 'Thiruvonam viratham {y}', desc: 'All {n} Thiruvonam (Shravana nakshatram) viratham dates of {y}, observed for Lord Vishnu.', lead: 'Thiruvonam nakshatram comes once a month and is sacred to Perumal.' },
    ta: { title: 'திருவோண விரதம் {y}', h1: 'திருவோண விரத நாட்கள் {y}', desc: '{y} ஆண்டின் {n} திருவோண நட்சத்திர விரத நாட்கள் – பெருமாளுக்கு உகந்தவை.', lead: 'மாதம் ஒருமுறை வரும் திருவோண நட்சத்திரம் பெருமாளுக்கு உகந்தது.' },
    method: { en: 'The day on which Thiruvonam nakshatram is running at sunrise in {c}.', ta: '{c} சூரிய உதயத்தில் திருவோண நட்சத்திரம் இருக்கும் நாள்.' }
  },
  'chandra-darshan-dates': {
    en: { title: 'Chandra Darshan Dates {y} – First Moon After Amavasai', h1: 'Chandra Darshan {y}', desc: 'All {n} Chandra Darshan dates of {y}: the first evening after Amavasai when the crescent moon can be seen in {c}, with moonset time.', lead: 'Seeing the thin crescent on the first evening after Amavasai is considered auspicious.' },
    ta: { title: 'சந்திர தரிசனம் {y} – அமாவாசைக்குப் பின் முதல் பிறை', h1: 'சந்திர தரிசன நாட்கள் {y}', desc: '{y} ஆண்டின் {n} சந்திர தரிசன நாட்கள்: அமாவாசைக்குப் பின் {c} நகரில் முதல் பிறை தெரியும் மாலை, சந்திர அஸ்தமன நேரத்துடன்.', lead: 'அமாவாசைக்குப் பின் முதல் மாலையில் மெல்லிய பிறையைக் காண்பது சுபம்.' },
    method: { en: 'The first evening after the new moon when, at sunset in {c}, the moon is at least 18 hours old and sets at least 40 minutes after the sun. Sky conditions decide whether you actually see it.', ta: 'அமாவாசைக்குப் பின், {c} அஸ்தமனத்தின் போது சந்திரன் குறைந்தது 18 மணி நேர வயதுடனும், சூரியனுக்கு 40 நிமிடமாவது பின் அஸ்தமிக்கும் முதல் மாலை. வானிலை தெளிவாக இருந்தால் தெரியும்.' }
  },
  tithi: {
    en: { title: 'Tithi {y} – Every Tithi Date of the Year', h1: 'Tithi dates {y}', desc: 'Tithi dates for {y}: Pournami, Amavasai, Ashtami, Navami, Ekadasi and every other tithi, with Tamil date and pirai.', lead: 'Pick a tithi to see every date it falls on in {y}.' },
    ta: { title: 'திதி {y} – ஆண்டின் அனைத்து திதி நாட்களும்', h1: 'திதி நாட்கள் {y}', desc: '{y} திதி நாட்கள்: பௌர்ணமி, அமாவாசை, அஷ்டமி, நவமி, ஏகாதசி மற்றும் அனைத்து திதிகளும், தமிழ் தேதி, பிறையுடன்.', lead: 'திதியைத் தேர்ந்தெடுத்து {y}-இல் அது வரும் நாட்களைக் காணுங்கள்.' },
    method: { en: 'A date is listed under the tithi that is running at sunrise in {c}, as in printed Tamil calendars. Tithi end times show when it changes during the day.', ta: 'அச்சிட்ட தமிழ் காலண்டர்களைப் போல, {c} சூரிய உதயத்தில் இருக்கும் திதியின் கீழ் தேதி பட்டியலிடப்படுகிறது. திதி முடியும் நேரமும் தரப்பட்டுள்ளது.' }
  },
  pournami: {
    en: { title: 'Pournami Dates {y} – Full Moon Days with Timings', h1: 'Pournami {y}', desc: 'All Pournami (full moon) dates of {y} with tithi start and end times for {c}, including Chithra Pournami and Karthigai Deepam.', lead: 'Full moon days of {y}, with exact start and end of the Pournami tithi.' },
    ta: { title: 'பௌர்ணமி {y} – நேரத்துடன்', h1: 'பௌர்ணமி நாட்கள் {y}', desc: '{y} ஆண்டின் அனைத்து பௌர்ணமி நாட்களும் {c} திதி தொடக்க, முடிவு நேரத்துடன்; சித்ரா பௌர்ணமி, கார்த்திகை தீபம் உட்பட.', lead: '{y} பௌர்ணமி நாட்கள் – பௌர்ணமி திதி தொடங்கும், முடியும் நேரத்துடன்.' }
  },
  amavasai: {
    en: { title: 'Amavasai Dates {y} – New Moon Days with Timings', h1: 'Amavasai {y}', desc: 'All Amavasai (new moon) dates of {y} with tithi start and end times for {c}, including Thai, Aadi and Mahalaya Amavasai.', lead: 'New moon days of {y}, the days for tharpanam, with exact start and end of the Amavasai tithi.' },
    ta: { title: 'அமாவாசை {y} – நேரத்துடன்', h1: 'அமாவாசை நாட்கள் {y}', desc: '{y} ஆண்டின் அனைத்து அமாவாசை நாட்களும் {c} திதி தொடக்க, முடிவு நேரத்துடன்; தை, ஆடி, மஹாளய அமாவாசை உட்பட.', lead: 'தர்ப்பணத்துக்கான {y} அமாவாசை நாட்கள் – திதி தொடங்கும், முடியும் நேரத்துடன்.' }
  },
  'ashtami-navami': {
    en: { title: 'Ashtami & Navami Dates {y}', h1: 'Ashtami & Navami {y}', desc: 'All Ashtami and Navami dates of {y}, days many families avoid for new beginnings.', lead: 'Many families avoid starting new things on Ashtami and Navami.' },
    ta: { title: 'அஷ்டமி, நவமி நாட்கள் {y}', h1: 'அஷ்டமி & நவமி {y}', desc: '{y} ஆண்டின் அனைத்து அஷ்டமி, நவமி நாட்களும் – புதிய தொடக்கங்களுக்குப் பலர் தவிர்க்கும் நாட்கள்.', lead: 'அஷ்டமி, நவமி நாட்களில் புதிய காரியங்களைப் பலர் தொடங்குவதில்லை.' }
  },
  'ashtami-navami-dashami': {
    en: { title: 'Ashtami, Navami & Dasami Dates {y}', h1: 'Ashtami, Navami & Dasami {y}', desc: 'All Ashtami, Navami and Dasami dates of {y} in one list, with Tamil date, pirai and the time each tithi ends in {c}.', lead: 'Ashtami, Navami and Dasami of {y} together, for quick planning.' },
    ta: { title: 'அஷ்டமி, நவமி, தசமி நாட்கள் {y}', h1: 'அஷ்டமி, நவமி & தசமி {y}', desc: '{y} ஆண்டின் அனைத்து அஷ்டமி, நவமி, தசமி நாட்களும் ஒரே பட்டியலில் – தமிழ் தேதி, பிறை, திதி முடியும் நேரத்துடன்.', lead: 'விரைவான திட்டமிடலுக்கு {y} அஷ்டமி, நவமி, தசமி ஒன்றாக.' }
  },
  'valarpirai-ashtami': {
    en: { title: 'Valarpirai Ashtami Dates {y}', h1: 'Valarpirai Ashtami {y}', desc: 'All Valarpirai (waxing moon) Ashtami dates of {y} with Tamil date and the time the tithi ends in {c}.', lead: 'Ashtami in the waxing fortnight.' },
    ta: { title: 'வளர்பிறை அஷ்டமி {y}', h1: 'வளர்பிறை அஷ்டமி {y}', desc: '{y} ஆண்டின் அனைத்து வளர்பிறை அஷ்டமி நாட்களும் – தமிழ் தேதி, திதி முடியும் நேரத்துடன் ({c}).', lead: 'வளர்பிறையில் வரும் அஷ்டமி.' }
  },
  'theipirai-ashtami': {
    en: { title: 'Theipirai Ashtami Dates {y} – Kalabhairava Ashtami', h1: 'Theipirai Ashtami {y}', desc: 'All Theipirai (waning) Ashtami dates of {y}, observed for Kalabhairavar.', lead: 'Ashtami in the waning fortnight, the day for Kalabhairavar worship.' },
    ta: { title: 'தேய்பிறை அஷ்டமி {y} – காலபைரவர்', h1: 'தேய்பிறை அஷ்டமி {y}', desc: '{y} ஆண்டின் அனைத்து தேய்பிறை அஷ்டமி நாட்களும் – காலபைரவர் வழிபாட்டுக்கு.', lead: 'தேய்பிறையில் வரும் அஷ்டமி – காலபைரவர் வழிபாட்டு நாள்.' }
  },
  'valarpirai-dates': {
    en: { title: 'Valarpirai Dates {y} – Waxing Moon Periods', h1: 'Valarpirai {y}', desc: 'Every Valarpirai (waxing moon) fortnight of {y}, from the day after Amavasai to Pournami, with start and end dates.', lead: 'The waxing fortnights of {y}, preferred for new beginnings.' },
    ta: { title: 'வளர்பிறை நாட்கள் {y}', h1: 'வளர்பிறை {y}', desc: '{y} ஆண்டின் ஒவ்வொரு வளர்பிறைக் காலமும் – அமாவாசைக்கு மறுநாள் முதல் பௌர்ணமி வரை, தொடக்க, முடிவு தேதிகளுடன்.', lead: 'புதிய தொடக்கங்களுக்கு விரும்பப்படும் {y} வளர்பிறைக் காலங்கள்.' }
  },
  'theipirai-dates': {
    en: { title: 'Theipirai Dates {y} – Waning Moon Periods', h1: 'Theipirai {y}', desc: 'Every Theipirai (waning moon) fortnight of {y}, from the day after Pournami to Amavasai, with start and end dates.', lead: 'The waning fortnights of {y}.' },
    ta: { title: 'தேய்பிறை நாட்கள் {y}', h1: 'தேய்பிறை {y}', desc: '{y} ஆண்டின் ஒவ்வொரு தேய்பிறைக் காலமும் – பௌர்ணமிக்கு மறுநாள் முதல் அமாவாசை வரை, தொடக்க, முடிவு தேதிகளுடன்.', lead: '{y} தேய்பிறைக் காலங்கள்.' }
  },
  'tamil-holidays': {
    en: { title: 'Tamil Nadu Government Holidays {y} – Full List', h1: 'Tamil Nadu holidays {y}', desc: 'The {n} Tamil Nadu Government public holidays for {y} with weekday, Tamil date and tithi, plus the bank closing day.', lead: 'Public holidays declared by the Tamil Nadu Government for {y}.' },
    ta: { title: 'தமிழ்நாடு அரசு விடுமுறை நாட்கள் {y}', h1: 'தமிழ்நாடு அரசு விடுமுறைகள் {y}', desc: '{y} தமிழ்நாடு அரசு அறிவித்த {n} பொது விடுமுறை நாட்கள் – கிழமை, தமிழ் தேதி, திதியுடன்; வங்கி கணக்கு முடிவு நாளும்.', lead: '{y} ஆண்டுக்குத் தமிழ்நாடு அரசு அறிவித்த பொது விடுமுறை நாட்கள்.' },
    method: { en: 'Source: Tamil Nadu Government holiday list for {y}. Dates of Ramzan, Bakrid, Muharram and Milad-un-Nabi depend on moon sighting and may be revised by the government.', ta: 'ஆதாரம்: தமிழ்நாடு அரசு {y} விடுமுறை அறிவிப்பு. ரம்ஜான், பக்ரீத், மொஹரம், மிலாது நபி தேதிகள் பிறை தெரிவதைப் பொறுத்து அரசால் மாற்றப்படலாம்.' }
  },
  'tamil-festivals': {
    en: { title: 'Tamil Festivals {y} – Dates of Every Major Festival', h1: 'Tamil festivals {y}', desc: 'Dates of {n} Tamil festivals in {y}: Pongal, Thaipusam, Tamil New Year, Aadi Perukku, Vinayagar Chathurthi, Deepavali, Karthigai Deepam and more.', lead: 'Every major Tamil festival of {y}, with Tamil date, tithi and nakshatram.' },
    ta: { title: 'தமிழ் பண்டிகைகள் {y} – அனைத்து தேதிகளும்', h1: 'தமிழ் பண்டிகைகள் {y}', desc: '{y} ஆண்டின் {n} தமிழ் பண்டிகைகளின் தேதிகள்: பொங்கல், தைப்பூசம், தமிழ்ப் புத்தாண்டு, ஆடிப் பெருக்கு, விநாயகர் சதுர்த்தி, தீபாவளி, கார்த்திகை தீபம் மற்றும் பல.', lead: '{y} ஆண்டின் முக்கிய தமிழ் பண்டிகைகள் – தமிழ் தேதி, திதி, நட்சத்திரத்துடன்.' }
  },
  'tamil-months': {
    en: { title: 'Tamil Months {y} – Start and End Dates', h1: 'Tamil months {y}', desc: 'Start and end dates of every Tamil month in {y}, from Thai to Margazhi, with the number of days and the sankranti time.', lead: 'When each Tamil month begins and ends in {y}.' },
    ta: { title: 'தமிழ் மாதங்கள் {y} – தொடக்க, முடிவு தேதிகள்', h1: 'தமிழ் மாதங்கள் {y}', desc: '{y} ஆண்டின் ஒவ்வொரு தமிழ் மாதத்தின் தொடக்க, முடிவு தேதிகள் – நாட்களின் எண்ணிக்கை, சங்கராந்தி நேரத்துடன்.', lead: '{y}-இல் ஒவ்வொரு தமிழ் மாதமும் எப்போது தொடங்கி முடிகிறது.' },
    method: { en: 'Month start dates follow the Tamil Nadu calendar tradition. Sankranti is the moment the sun enters the next rasi (Lahiri, sidereal), calculated for {c}.', ta: 'மாதத் தொடக்கத் தேதிகள் தமிழ்நாட்டுக் காலண்டர் மரபைப் பின்பற்றுகின்றன. சூரியன் அடுத்த ராசியில் பிரவேசிக்கும் நேரமே சங்கராந்தி (லஹிரி, நிராயனம்), {c}.' }
  },
  retrograde: {
    en: { title: 'Planetary Retrograde {y} – Vakra Periods', h1: 'Retrograde planets {y}', desc: 'Retrograde (vakra) periods of Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune and Pluto in {y}, with start and end times in IST.', lead: 'When each planet appears to move backwards in {y}. Rahu and Ketu are always retrograde.' },
    ta: { title: 'வக்ர கிரகங்கள் {y}', h1: 'வக்ர கிரகங்கள் {y}', desc: '{y} ஆண்டில் புதன், சுக்கிரன், செவ்வாய், குரு, சனி, யுரேனஸ், நெப்டியூன், புளூட்டோ வக்ர காலங்கள் – இந்திய நேரப்படி தொடக்கம், முடிவு.', lead: '{y}-இல் ஒவ்வொரு கிரகமும் பின்னோக்கிச் செல்வது போல் தோன்றும் காலம். ராகு, கேது எப்போதும் வக்ரம்.' }
  },
  'site-map': {
    en: { title: 'Site Map', h1: 'Site map', desc: 'Every page of the {b} Tamil calendar {y}: daily and monthly calendars, timings, muhurtham, viratham, tithi, festivals and holidays.', lead: 'Every page on the site.' },
    ta: { title: 'தள வரைபடம்', h1: 'தள வரைபடம்', desc: '{b} தமிழ் காலண்டர் {y} – தினசரி, மாத காலண்டர், நேரங்கள், முகூர்த்தம், விரதம், திதி, பண்டிகைகள், விடுமுறைகள் – அனைத்துப் பக்கங்களும்.', lead: 'தளத்தின் அனைத்துப் பக்கங்களும்.' }
  },
  about: { en: { title: 'About', h1: 'About {b}', desc: 'About {b}, a Tamil calendar and panchangam for {c}: how tithi, nakshatram, Nalla Neram and muhurtham dates are worked out.', lead: '' }, ta: { title: 'எங்களைப் பற்றி', h1: '{b} பற்றி', desc: '{c} நகருக்கான தமிழ் காலண்டர், பஞ்சாங்கம் – {b} பற்றி: திதி, நட்சத்திரம், நல்ல நேரம், முகூர்த்தம் எப்படி கணக்கிடப்படுகின்றன.', lead: '' } },
  disclaimer: { en: { title: 'Disclaimer', h1: 'Disclaimer', desc: 'Disclaimer for the {b} Tamil calendar: timings are for general guidance; confirm wedding and griha pravesam muhurthams with your priest.', lead: '' }, ta: { title: 'பொறுப்புத் துறப்பு', h1: 'பொறுப்புத் துறப்பு', desc: '{b} தமிழ் காலண்டர் – பொறுப்புத் துறப்பு: நேரங்கள் பொது வழிகாட்டலுக்கு மட்டும்; முக்கிய முகூர்த்தங்களைப் புரோகிதரிடம் உறுதி செய்யுங்கள்.', lead: '' } },
  'privacy-policy': { en: { title: 'Privacy Policy', h1: 'Privacy policy', desc: 'Privacy policy of {b}: no account, no personal details collected; only Google Fonts is loaded from outside the site.', lead: '' }, ta: { title: 'தனியுரிமைக் கொள்கை', h1: 'தனியுரிமைக் கொள்கை', desc: '{b} தனியுரிமைக் கொள்கை: கணக்கு தேவையில்லை, தனிப்பட்ட விவரங்கள் சேகரிக்கப்படுவதில்லை.', lead: '' } },
  'terms-of-use': { en: { title: 'Terms of Use', h1: 'Terms of use', desc: 'Terms of use of {b}: read, print and share pages for personal use, and link back instead of copying whole tables.', lead: '' }, ta: { title: 'பயன்பாட்டு விதிமுறைகள்', h1: 'பயன்பாட்டு விதிமுறைகள்', desc: '{b} பயன்பாட்டு விதிமுறைகள்: தனிப்பட்ட பயன்பாட்டுக்குப் படிக்கலாம், அச்சிடலாம், பகிரலாம்; அட்டவணைகளை நகலெடுக்காமல் இணைப்பு தாருங்கள்.', lead: '' } },
  'contact-us': { en: { title: 'Contact Us', h1: 'Contact us', desc: 'Contact {b} with corrections, suggestions and feedback on the Tamil calendar, panchangam timings and muhurtham dates.', lead: '' }, ta: { title: 'தொடர்பு கொள்ள', h1: 'தொடர்பு கொள்ள', desc: 'தமிழ் காலண்டர், பஞ்சாங்க நேரங்கள், முகூர்த்த நாட்கள் குறித்த திருத்தங்கள், கருத்துகளுக்கு {b} உடன் தொடர்பு கொள்ளுங்கள்.', lead: '' } },
  '404': { en: { title: 'Page Not Found', h1: 'This page is not on the calendar', desc: 'The page you asked for does not exist.', lead: 'The link may be old. Try today’s panchangam or the site map.' }, ta: { title: 'பக்கம் கிடைக்கவில்லை', h1: 'இந்தப் பக்கம் இல்லை', desc: 'நீங்கள் தேடிய பக்கம் இல்லை.', lead: 'இணைப்பு பழையதாக இருக்கலாம். இன்றைய பஞ்சாங்கம் அல்லது தள வரைபடத்தைப் பாருங்கள்.' } }
};

// Per-tithi pages
const TITHI_PAGES = [
  ['prathamai-tithi', [0, 15]], ['dwitiya-tithi', [1, 16]], ['tritiya-tithi', [2, 17]], ['chaturthi-tithi', [3, 18]],
  ['panchami-tithi', [4, 19]], ['sashti-tithi', [5, 20]], ['saptami-tithi', [6, 21]], ['ashtami-tithi', [7, 22]],
  ['navami-tithi', [8, 23]], ['dashami-tithi', [9, 24]], ['ekadashi-tithi', [10, 25]], ['dwadashi-tithi', [11, 26]],
  ['trayodashi-tithi', [12, 27]], ['chaturdashi-tithi', [13, 28]]
];

module.exports = { C, TITHI_PAGES };

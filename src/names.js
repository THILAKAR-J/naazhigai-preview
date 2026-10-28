'use strict';
// Bilingual names used across the site. English spellings follow the common Tamil-calendar style.
const P = (en, ta) => ({ en, ta });

const TITHI_BASE = [
  P('Prathamai', 'பிரதமை'), P('Dwitiya', 'துவிதியை'), P('Tritiya', 'திருதியை'), P('Chathurthi', 'சதுர்த்தி'),
  P('Panchami', 'பஞ்சமி'), P('Shashti', 'சஷ்டி'), P('Saptami', 'சப்தமி'), P('Ashtami', 'அஷ்டமி'),
  P('Navami', 'நவமி'), P('Dasami', 'தசமி'), P('Ekadasi', 'ஏகாதசி'), P('Dwadashi', 'துவாதசி'),
  P('Trayodasi', 'திரயோதசி'), P('Chaturdashi', 'சதுர்த்தசி')
];
const TITHI = [];
for (let i = 0; i < 30; i++) {
  if (i === 14) TITHI.push(P('Pournami', 'பௌர்ணமி'));
  else if (i === 29) TITHI.push(P('Amavasai', 'அமாவாசை'));
  else TITHI.push(TITHI_BASE[i % 15]);
}
const PIRAI = { V: P('Valarpirai', 'வளர்பிறை'), T: P('Theipirai', 'தேய்பிறை') };

const NAK = [
  P('Aswini', 'அசுவினி'), P('Bharani', 'பரணி'), P('Karthigai', 'கார்த்திகை'), P('Rohini', 'ரோகிணி'),
  P('Mirugasirisham', 'மிருகசீரிடம்'), P('Thiruvathirai', 'திருவாதிரை'), P('Punarpoosam', 'புனர்பூசம்'),
  P('Poosam', 'பூசம்'), P('Ayilyam', 'ஆயில்யம்'), P('Magam', 'மகம்'), P('Pooram', 'பூரம்'),
  P('Uthiram', 'உத்திரம்'), P('Hastham', 'அஸ்தம்'), P('Chithirai', 'சித்திரை'), P('Swathi', 'சுவாதி'),
  P('Visakam', 'விசாகம்'), P('Anusham', 'அனுஷம்'), P('Kettai', 'கேட்டை'), P('Moolam', 'மூலம்'),
  P('Pooradam', 'பூராடம்'), P('Uthiradam', 'உத்திராடம்'), P('Thiruvonam', 'திருவோணம்'),
  P('Avittam', 'அவிட்டம்'), P('Sathayam', 'சதயம்'), P('Poorattathi', 'பூரட்டாதி'),
  P('Uthirattathi', 'உத்திரட்டாதி'), P('Revathi', 'ரேவதி')
];
const RASI = [
  P('Mesham', 'மேஷம்'), P('Rishabam', 'ரிஷபம்'), P('Mithunam', 'மிதுனம்'), P('Kadagam', 'கடகம்'),
  P('Simmam', 'சிம்மம்'), P('Kanni', 'கன்னி'), P('Thulam', 'துலாம்'), P('Viruchigam', 'விருச்சிகம்'),
  P('Dhanusu', 'தனுசு'), P('Magaram', 'மகரம்'), P('Kumbam', 'கும்பம்'), P('Meenam', 'மீனம்')
];
const TMONTH = [
  P('Chithirai', 'சித்திரை'), P('Vaigasi', 'வைகாசி'), P('Aani', 'ஆனி'), P('Aadi', 'ஆடி'),
  P('Avani', 'ஆவணி'), P('Purattasi', 'புரட்டாசி'), P('Aippasi', 'ஐப்பசி'), P('Karthigai', 'கார்த்திகை'),
  P('Margazhi', 'மார்கழி'), P('Thai', 'தை'), P('Masi', 'மாசி'), P('Panguni', 'பங்குனி')
];
const WEEKDAY = [
  P('Sunday', 'ஞாயிறு'), P('Monday', 'திங்கள்'), P('Tuesday', 'செவ்வாய்'), P('Wednesday', 'புதன்'),
  P('Thursday', 'வியாழன்'), P('Friday', 'வெள்ளி'), P('Saturday', 'சனி')
];
const WEEKDAY_SHORT = [P('Sun', 'ஞா'), P('Mon', 'தி'), P('Tue', 'செ'), P('Wed', 'பு'), P('Thu', 'வி'), P('Fri', 'வெ'), P('Sat', 'ச')];
const WEEKDAY_TAMIL_EN = ['Nyaayiru', 'Thingal', 'Chevvai', 'Budhan', 'Vyalan', 'Velli', 'Sani'];
const GMONTH = [
  P('January', 'ஜனவரி'), P('February', 'பிப்ரவரி'), P('March', 'மார்ச்'), P('April', 'ஏப்ரல்'),
  P('May', 'மே'), P('June', 'ஜூன்'), P('July', 'ஜூலை'), P('August', 'ஆகஸ்ட்'),
  P('September', 'செப்டம்பர்'), P('October', 'அக்டோபர்'), P('November', 'நவம்பர்'), P('December', 'டிசம்பர்')
];
const GMONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Tamil (60-year cycle) names relevant to the site's range
const TYEAR = { Vishvavasu: P('Vishvavasu', 'விசுவாவசு'), Parabhava: P('Parabhava', 'பராபவ'), Plavanga: P('Plavanga', 'பிலவங்க') };

const GOWRI = {
  U: P('Uthi', 'உத்தி'), A: P('Amirdha', 'அமிர்தம்'), R: P('Rogam', 'ரோகம்'), L: P('Laabam', 'லாபம்'),
  D: P('Dhanam', 'தனம்'), S: P('Sugam', 'சுகம்'), O: P('Soram', 'சோரம்'), V: P('Visham', 'விஷம்')
};
const GOWRI_GOOD = { U: 1, A: 1, L: 1, D: 1, S: 1 };
// Gowri Panchangam sequences (8 equal parts), Sunday..Saturday. O = Soram.
const GOWRI_DAY = ['UARLDSOV', 'AVRLDSOU', 'RLDSOUVA', 'LDSOVUAR', 'DSOUAVRL', 'SOUVARLD', 'OUVARLDS'];
const GOWRI_NIGHT = ['DSOVUARL', 'SOUAVRLD', 'OUVARLDS', 'UARLDSOV', 'AVRLDSOU', 'RLDSOUVA', 'LDSOUVAR'];

// Traditional fixed timings as clock hours (15 = 3:00 PM), Sunday..Saturday; each lasts 1.5 h.
const RAHU = [16.5, 7.5, 15, 12, 13.5, 10.5, 9];
const YAMA = [12, 10.5, 9, 7.5, 6, 15, 13.5];
const KULIGAI = [15, 13.5, 12, 10.5, 9, 7.5, 6];
const SOOLAM = [
  { dir: P('Merku (West)', 'மேற்கு'), par: P('Vellam (Jaggery)', 'வெல்லம்') },
  { dir: P('Kilakku (East)', 'கிழக்கு'), par: P('Thayir (Curd)', 'தயிர்') },
  { dir: P('Vadakku (North)', 'வடக்கு'), par: P('Paal (Milk)', 'பால்') },
  { dir: P('Vadakku (North)', 'வடக்கு'), par: P('Paal (Milk)', 'பால்') },
  { dir: P('Therku (South)', 'தெற்கு'), par: P('Thailam (Balm)', 'தைலம்') },
  { dir: P('Merku (West)', 'மேற்கு'), par: P('Vellam (Jaggery)', 'வெல்லம்') },
  { dir: P('Kilakku (East)', 'கிழக்கு'), par: P('Thayir (Curd)', 'தயிர்') }
];

module.exports = {
  P, TITHI, TITHI_BASE, PIRAI, NAK, RASI, TMONTH, WEEKDAY, WEEKDAY_SHORT, WEEKDAY_TAMIL_EN, GMONTH, GMONTH_SHORT,
  TYEAR, GOWRI, GOWRI_GOOD, GOWRI_DAY, GOWRI_NIGHT, RAHU, YAMA, KULIGAI, SOOLAM
};

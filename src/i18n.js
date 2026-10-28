'use strict';
// UI labels and page copy in English and Tamil. {b} = brand, {y} = year, {c} = city.
const L = {
  en: {
    lang: 'English', otherLang: 'தமிழ்', viewIn: 'View in Tamil',
    skip: 'Skip to content', home: 'Home', today: 'Today', tomorrow: 'Tomorrow', yesterday: 'Yesterday',
    next: 'Next', previous: 'Previous', none: 'None', yes: 'Yes', no: 'No', until: 'until', then: 'then', nextDay: '(next day)',
    date: 'Date', weekday: 'Weekday', tamilDate: 'Tamil date', tamilMonth: 'Tamil month', dayLbl: 'Day', nightLbl: 'Night',
    nalla: 'Nalla Neram', gowri: 'Gowri Nalla Neram', rahu: 'Rahu Kalam', yama: 'Yamagandam', kuligai: 'Kuligai Neram',
    tithi: 'Tithi', nak: 'Nakshatram', pirai: 'Pirai', sunrise: 'Sunrise', sunset: 'Sunset', moonrise: 'Moonrise', moonset: 'Moonset',
    chandrashtamam: 'Chandrashtamam', soolam: 'Soolam', pariharam: 'Pariharam', muhurtham: 'Muhurtham', subha: 'Subha Muhurtham',
    holiday: 'Holiday', publicHoliday: 'Public holiday', bankHoliday: 'Bank holiday', festival: 'Festival', festivals: 'Festivals',
    viratham: 'Viratham', virathams: 'Viratham days', occasion: 'Occasion', type: 'Type', starts: 'Starts', ends: 'Ends', days: 'Days',
    good: 'Good', avoid: 'Avoid', caution: 'Caution', direction: 'Direction', gowriSlot: 'Gowri', time: 'Time', notMuhurtham: 'No muhurtham', noHoliday: 'No holiday',
    yearWord: 'year', rasi: 'rasi', moonIn: 'Moon in', forRasi: 'for', from: 'From', to: 'To', planet: 'Planet', duration: 'Duration',
    pradoshaKalam: 'Pradosha kalam', nishita: 'Nishita (midnight) puja', dailyCal: 'Daily Calendar', monthlyCal: 'Monthly Calendar',
    seeAll: 'See all', moreInfo: 'Open the day', viewMonth: 'View the month', prevDay: 'Previous day', nextDayLink: 'Next day', prevMonth: 'Previous month', nextMonth: 'Next month',
    allMonths: 'All months of {y}', explore: 'Explore the calendar', faq: 'Frequently asked questions', method: 'How this is calculated',
    comingUp: 'Coming up', daysTo: 'days to', dayTo: 'day to', isToday: 'today', upMu: 'Upcoming muhurtham dates', upVi: 'Upcoming viratham days',
    upTi: 'Upcoming tithi dates', upFe: 'Upcoming festivals & holidays', weekly: 'Rahu Kalam, Yamagandam & Kuligai by weekday',
    weeklyNote: 'All seven weekdays with soolam and pariharam. Today’s row is highlighted.',
    details: 'Panchangam details', detailsNote: 'Everything for {d} in one place.', gowriTable: 'Gowri Panchangam', gowriTableNote: 'The day and the night are each split into eight equal parts, starting at sunrise and at sunset.',
    goodTimes: 'Auspicious times', avoidTimes: 'Times to avoid', onThisDay: 'On this day', noEvents: 'No festival, holiday or viratham on this date.',
    noRows: 'No dates in this list.', tamilYearLbl: 'Tamil year', location: 'Location', notToday: 'Not today', isTodayLong: 'Yes, today',
    nextDate: 'Next date', prevDate: 'Previous date', todayQ: 'Today', byMonth: 'By month', count: 'Count', sankranti: 'Sankranti (sun enters)',
    footerAbout: 'Tamil calendar and panchangam, bold and clear.', calendar: 'Calendar', timings: 'Timings', dates: 'Dates', more: 'More',
    fine: '© {y} {b} (placeholder brand name). Panchangam calculated for {c}. Timings are for general guidance; please confirm important muhurthams with your family priest.',
    longWeekend: 'Long weekend', weekend: 'Falls on a weekend', ofYear: 'in {y}', tomorrowLbl: 'Tomorrow', important: 'Important tithi dates'
  },
  ta: {
    lang: 'தமிழ்', otherLang: 'English', viewIn: 'View in English',
    skip: 'உள்ளடக்கத்திற்குச் செல்ல', home: 'முகப்பு', today: 'இன்று', tomorrow: 'நாளை', yesterday: 'நேற்று',
    next: 'அடுத்து', previous: 'முந்தைய', none: 'இல்லை', yes: 'ஆம்', no: 'இல்லை', until: 'வரை', then: 'பிறகு', nextDay: '(மறுநாள்)',
    date: 'தேதி', weekday: 'கிழமை', tamilDate: 'தமிழ் தேதி', tamilMonth: 'தமிழ் மாதம்', dayLbl: 'பகல்', nightLbl: 'இரவு',
    nalla: 'நல்ல நேரம்', gowri: 'கௌரி நல்ல நேரம்', rahu: 'ராகு காலம்', yama: 'எமகண்டம்', kuligai: 'குளிகை நேரம்',
    tithi: 'திதி', nak: 'நட்சத்திரம்', pirai: 'பிறை', sunrise: 'சூரிய உதயம்', sunset: 'சூரிய அஸ்தமனம்', moonrise: 'சந்திர உதயம்', moonset: 'சந்திர அஸ்தமனம்',
    chandrashtamam: 'சந்திராஷ்டமம்', soolam: 'சூலம்', pariharam: 'பரிகாரம்', muhurtham: 'முகூர்த்தம்', subha: 'சுப முகூர்த்தம்',
    holiday: 'விடுமுறை', publicHoliday: 'அரசு விடுமுறை', bankHoliday: 'வங்கி விடுமுறை', festival: 'பண்டிகை', festivals: 'பண்டிகைகள்',
    viratham: 'விரதம்', virathams: 'விரத நாட்கள்', occasion: 'நிகழ்வு', type: 'வகை', starts: 'தொடக்கம்', ends: 'முடிவு', days: 'நாட்கள்',
    good: 'நல்லது', avoid: 'தவிர்க்கவும்', caution: 'கவனம்', direction: 'திசை', gowriSlot: 'கௌரி', time: 'நேரம்', notMuhurtham: 'முகூர்த்தம் இல்லை', noHoliday: 'விடுமுறை இல்லை',
    yearWord: 'ஆண்டு', rasi: 'ராசி', moonIn: 'சந்திரன்', forRasi: '', from: 'முதல்', to: 'வரை', planet: 'கிரகம்', duration: 'கால அளவு',
    pradoshaKalam: 'பிரதோஷ காலம்', nishita: 'நிசி (நள்ளிரவு) பூஜை', dailyCal: 'தினசரி காலண்டர்', monthlyCal: 'மாத காலண்டர்',
    seeAll: 'அனைத்தும் காண', moreInfo: 'அன்றைய விவரம்', viewMonth: 'மாதக் காலண்டர்', prevDay: 'முந்தைய நாள்', nextDayLink: 'அடுத்த நாள்', prevMonth: 'முந்தைய மாதம்', nextMonth: 'அடுத்த மாதம்',
    allMonths: '{y} – அனைத்து மாதங்களும்', explore: 'காலண்டரில் மேலும்', faq: 'அடிக்கடி கேட்கப்படும் கேள்விகள்', method: 'கணக்கிடும் முறை',
    comingUp: 'வரவிருப்பவை', daysTo: 'நாட்களில்', dayTo: 'நாளில்', isToday: 'இன்று', upMu: 'வரவிருக்கும் முகூர்த்த நாட்கள்', upVi: 'வரவிருக்கும் விரத நாட்கள்',
    upTi: 'வரவிருக்கும் திதி நாட்கள்', upFe: 'வரவிருக்கும் பண்டிகைகள் & விடுமுறைகள்', weekly: 'கிழமை வாரியாக ராகு காலம், எமகண்டம், குளிகை',
    weeklyNote: 'ஏழு கிழமைகளுக்கும் சூலம், பரிகாரத்துடன். இன்றைய வரிசை மஞ்சள் நிறத்தில்.',
    details: 'பஞ்சாங்க விவரங்கள்', detailsNote: '{d} – அனைத்தும் ஒரே இடத்தில்.', gowriTable: 'கௌரி பஞ்சாங்கம்', gowriTableNote: 'பகலும் இரவும் தலா எட்டு சம பாகங்களாகப் பிரிக்கப்படுகின்றன; சூரிய உதயம், அஸ்தமனத்திலிருந்து தொடங்கும்.',
    goodTimes: 'நல்ல நேரங்கள்', avoidTimes: 'தவிர்க்க வேண்டிய நேரங்கள்', onThisDay: 'இன்றைய சிறப்பு', noEvents: 'இந்த நாளில் பண்டிகை, விடுமுறை அல்லது விரதம் இல்லை.',
    noRows: 'இந்தப் பட்டியலில் தேதிகள் இல்லை.', tamilYearLbl: 'தமிழ் ஆண்டு', location: 'இடம்', notToday: 'இன்று இல்லை', isTodayLong: 'ஆம், இன்று',
    nextDate: 'அடுத்த தேதி', prevDate: 'முந்தைய தேதி', todayQ: 'இன்று', byMonth: 'மாத வாரியாக', count: 'எண்ணிக்கை', sankranti: 'சங்கராந்தி (சூரியன் பிரவேசம்)',
    footerAbout: 'தமிழ் காலண்டர், பஞ்சாங்கம் – தெளிவாக, எளிதாக.', calendar: 'காலண்டர்', timings: 'நேரங்கள்', dates: 'நாட்கள்', more: 'மேலும்',
    fine: '© {y} {b} (தற்காலிகப் பெயர்). பஞ்சாங்கம் {c} நகருக்குக் கணக்கிடப்பட்டது. நேரங்கள் பொது வழிகாட்டலுக்கு மட்டும்; முக்கிய முகூர்த்தங்களை உங்கள் குடும்ப புரோகிதரிடம் உறுதிப்படுத்துங்கள்.',
    longWeekend: 'நீண்ட வார இறுதி', weekend: 'வார இறுதியில்', ofYear: '{y}', tomorrowLbl: 'நாளை', important: 'முக்கிய திதி நாட்கள்'
  }
};

const V = {
  pradosham: { en: 'Pradosham', ta: 'பிரதோஷம்' }, 'pradosham:soma': { en: 'Soma Pradosham', ta: 'சோம பிரதோஷம்' }, 'pradosham:sani': { en: 'Sani Pradosham', ta: 'சனி பிரதோஷம்' },
  sankatahara: { en: 'Sankatahara Chathurthi', ta: 'சங்கடஹர சதுர்த்தி' }, 'sankatahara:angaraki': { en: 'Angaraki Sankatahara Chathurthi', ta: 'அங்காரக சங்கடஹர சதுர்த்தி' },
  sashti: { en: 'Sashti Viratham', ta: 'சஷ்டி விரதம்' }, chaturthi: { en: 'Chathurthi Viratham', ta: 'சதுர்த்தி விரதம்' },
  karthigai: { en: 'Karthigai Viratham', ta: 'கார்த்திகை விரதம்' }, 'karthigai:deepam': { en: 'Karthigai Deepam', ta: 'கார்த்திகை தீபம்' },
  shivaratri: { en: 'Masa Shivaratri', ta: 'மாத சிவராத்திரி' }, 'shivaratri:maha': { en: 'Maha Shivaratri', ta: 'மகா சிவராத்திரி' },
  thiruvonam: { en: 'Thiruvonam Viratham', ta: 'திருவோண விரதம்' }, chandra: { en: 'Chandra Darshan', ta: 'சந்திர தரிசனம்' },
  ekadasi: { en: 'Ekadasi Viratham', ta: 'ஏகாதசி விரதம்' }, 'ekadasi:vaikunta': { en: 'Vaikunta Ekadasi', ta: 'வைகுண்ட ஏகாதசி' }
};

module.exports = { L, V };

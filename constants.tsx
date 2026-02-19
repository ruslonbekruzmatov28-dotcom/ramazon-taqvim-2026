
import { Region, PrayerTimes } from './types';

export const REGIONS: Region[] = [
  { id: 12, name: 'Урганч', nameLatin: 'Urgench', offset: 0 }
];

export interface DistrictOffset {
  name: string;
  sahar: number;
  iftor: number;
}

export const KHOREZM_DISTRICTS: DistrictOffset[] = [
  { name: 'Урганч', sahar: 0, iftor: 0 },
  { name: 'Боғот', sahar: 0, iftor: 0 },
  { name: 'Гурлан', sahar: 0, iftor: 1 },
  { name: 'Хонқа', sahar: 0, iftor: 0 },
  { name: 'Ҳазорасп', sahar: -1, iftor: -1 },
  { name: 'Хива', sahar: 1, iftor: 1 },
  { name: 'Қўшкўпир', sahar: 1, iftor: 1 },
  { name: 'Шовот', sahar: 0, iftor: 1 },
  { name: 'Янгиариқ', sahar: 0, iftor: 0 },
  { name: 'Янгибозор', sahar: 0, iftor: 0 },
  { name: 'Тупроққалъа', sahar: -3, iftor: -1 }
];

export const KHOREZM_2026_CALENDAR: PrayerTimes[] = [
  { day: 1, date: '19-Фев', fajr: '06:29', maghrib: '18:40' },
  { day: 2, date: '20-Фев', fajr: '06:27', maghrib: '18:41' },
  { day: 3, date: '21-Фев', fajr: '06:26', maghrib: '18:42' },
  { day: 4, date: '22-Фев', fajr: '06:25', maghrib: '18:43' },
  { day: 5, date: '23-Фев', fajr: '06:23', maghrib: '18:44' },
  { day: 6, date: '24-Фев', fajr: '06:22', maghrib: '18:46' },
  { day: 7, date: '25-Фев', fajr: '06:20', maghrib: '18:47' },
  { day: 8, date: '26-Фев', fajr: '06:19', maghrib: '18:48' },
  { day: 9, date: '27-Фев', fajr: '06:17', maghrib: '18:49' },
  { day: 10, date: '28-Фев', fajr: '06:16', maghrib: '18:50' },
  { day: 11, date: '1-Мар', fajr: '06:14', maghrib: '18:52' },
  { day: 12, date: '2-Мар', fajr: '06:13', maghrib: '18:53' },
  { day: 13, date: '3-Мар', fajr: '06:11', maghrib: '18:54' },
  { day: 14, date: '4-Мар', fajr: '06:10', maghrib: '18:55' },
  { day: 15, date: '5-Мар', fajr: '06:08', maghrib: '18:56' },
  { day: 16, date: '6-Мар', fajr: '06:06', maghrib: '18:57' },
  { day: 17, date: '7-Мар', fajr: '06:05', maghrib: '18:59' },
  { day: 18, date: '8-Мар', fajr: '06:03', maghrib: '19:00' },
  { day: 19, date: '9-Мар', fajr: '06:02', maghrib: '19:01' },
  { day: 20, date: '10-Мар', fajr: '06:00', maghrib: '19:02' },
  { day: 21, date: '11-Мар', fajr: '05:58', maghrib: '19:03' },
  { day: 22, date: '12-Мар', fajr: '05:56', maghrib: '19:04' },
  { day: 23, date: '13-Мар', fajr: '05:55', maghrib: '19:05' },
  { day: 24, date: '14-Мар', fajr: '05:53', maghrib: '19:07' },
  { day: 25, date: '15-Мар', fajr: '05:51', maghrib: '19:08' },
  { day: 26, date: '16-Мар', fajr: '05:50', maghrib: '19:09' },
  { day: 27, date: '17-Мар', fajr: '05:48', maghrib: '19:10' },
  { day: 28, date: '18-Мар', fajr: '05:46', maghrib: '19:11' },
  { day: 29, date: '19-Мар', fajr: '05:44', maghrib: '19:12' },
  { day: 30, date: '20-Мар', fajr: '05:43', maghrib: '19:13' }
];

export const DUAS = {
  sahar: {
    title: 'Саҳарлик (оғиз ёпиш) дуоси',
    arabic: 'نَوَيْتُ أَنْ أَصُومَ صَوْمَ شَهْرِ رَمَضَانَ مِنَ الْفَجْرِ إِلَى الْمَغْرِبِ، خَالِصًا لِلَّهِ تَعَالَى',
    transliteration: 'Навайту ан асума совма шаҳри Рамазона минал фажри илал мағриби, холисан лиллаҳи таъала.',
    translation: 'Рамазон ойининг рўзасини субҳдан то кун ботгунча холис Аллоҳ учун тутишни ният қилдим.'
  },
  iftar: {
    title: 'Ифторлик (оғиз очиш) дуоси',
    arabic: 'اللَّهُمَّ لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَيْكَ تَوَكَّلْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ، فَاغْفِرْ لِي يَا غَفَّارُ مَا قَدَّمْتُ وَمَا أَخَّرْتُ',
    transliteration: 'Аллоҳумма лака сумту va бика аманту va аъалайка таваккалту va ъала ризқика афтарту, фағфирли, йа Ғоффару, ма қоддамту vама аххорту.',
    translation: 'Эй Аллоҳ, Сен учун рўза тутдим, Сенга иймон келтирдим va Сенга таваккал қилдим va берган ризқинг билан ифтор қилдим. Эй гуноҳларни мағфират қилгувчи Зот, олдинги va кейинги гуноҳларимни кечир.'
  }
};

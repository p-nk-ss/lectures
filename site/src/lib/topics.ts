/* Motifs for a lecture's title slide. 'heart' and 'ecg' are drawn (CSS pixels / SVG);
   the rest are sprites in public/icons/icon-<name>.png. */
export type TopicIcon =
  | 'heart'
  | 'ecg'
  | 'kit'
  | 'hp'
  | 'syringe'
  | 'ampoule'
  | 'capsule'
  | 'pill'
  | 'thermo';

export interface Topic {
  id: string;        // '01'..'08'
  order: number;
  module: 1 | 2;
  title: string;     // full topic title
  short: string;     // short label for cards/navigation
  color: string;     // CSS var reference
  icons: [TopicIcon, TopicIcon, TopicIcon];  // title-slide motif, distinct per topic
}

export const TOPICS: Topic[] = [
  { id: '01', order: 1, module: 1, title: 'Поняття про анестезіологію та реаніматологію. Види анестезії', short: 'Анестезіологія та реаніматологія', color: 'var(--topic-01)', icons: ['syringe', 'ecg', 'thermo'] },
  { id: '02', order: 2, module: 1, title: 'Інгаляційний наркоз і неінгаляційний наркоз', short: 'Наркоз', color: 'var(--topic-02)', icons: ['ampoule', 'hp', 'capsule'] },
  { id: '03', order: 3, module: 1, title: 'Термінальні стани', short: 'Термінальні стани', color: 'var(--topic-03)', icons: ['kit', 'heart', 'hp'] },
  { id: '04', order: 4, module: 1, title: 'Реанімація та інтенсивна терапія при гострій серцево-судинній недостатності', short: 'Гостра серцево-судинна недостатність', color: 'var(--topic-04)', icons: ['heart', 'ecg', 'ampoule'] },
  { id: '05', order: 5, module: 1, title: 'Реанімація та інтенсивна терапія при гострій дихальній недостатності', short: 'Гостра дихальна недостатність', color: 'var(--topic-05)', icons: ['hp', 'ecg', 'kit'] },
  { id: '06', order: 6, module: 2, title: 'Види шоку: клініка, діагностика, реанімація та інтенсивна терапія', short: 'Шок', color: 'var(--topic-06)', icons: ['hp', 'heart', 'ampoule'] },
  { id: '07', order: 7, module: 2, title: 'Коматозні стани: клініка, діагностика, реанімація та інтенсивна терапія', short: 'Коматозні стани', color: 'var(--topic-07)', icons: ['thermo', 'ecg', 'kit'] },
  { id: '08', order: 8, module: 2, title: 'Гострі отруєння: клініка, діагностика, реанімація та інтенсивна терапія', short: 'Гострі отруєння', color: 'var(--topic-08)', icons: ['pill', 'capsule', 'syringe'] },
];

export const topicById = (id: string): Topic | undefined => TOPICS.find((t) => t.id === id);

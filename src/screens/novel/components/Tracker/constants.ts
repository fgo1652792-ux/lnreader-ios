import { ImageSourcePropType } from 'react-native';

import { TrackerName, UserListStatus } from '@services/Trackers';
import { getString } from '@i18n/translations';
import { ScoreFormat, ScoreFormatting } from './types';

export const TRACKER_ICONS: Record<TrackerName, ImageSourcePropType> = {
  MyAnimeList: require('../../../../../assets/mal.png'),
  MangaUpdates: require('../../../../../assets/mangaupdates.png'),
  AniList: require('../../../../../assets/anilist.png'),
  Kitsu: require('../../../../../assets/kitsu.png'),
};

export const getStatusLabels = (): Record<UserListStatus, string> => ({
  CURRENT: getString('trackScreen.statusLabels.reading'),
  PLANNING: getString('trackScreen.statusLabels.planToRead'),
  COMPLETED: getString('trackScreen.statusLabels.completed'),
  DROPPED: getString('trackScreen.statusLabels.dropped'),
  PAUSED: getString('trackScreen.statusLabels.onHold'),
  REPEATING: getString('trackScreen.statusLabels.rereading'),
});

export const getMalScores = (): Record<number, string> => ({
  0: getString('trackScreen.malScores.noScore'),
  1: getString('trackScreen.malScores.appalling'),
  2: getString('trackScreen.malScores.worseThanBad'),
  3: getString('trackScreen.malScores.bad'),
  4: getString('trackScreen.malScores.average'),
  5: getString('trackScreen.malScores.good'),
  6: getString('trackScreen.malScores.veryGood'),
  7: getString('trackScreen.malScores.goodPlus'),
  8: getString('trackScreen.malScores.excellent'),
  /* MAL's top grade (10) shares the 'Masterpiece' label */
  9: getString('trackScreen.malScores.masterpiece'),
  10: getString('trackScreen.malScores.masterpiece'),
});

export const getTrackerIcon = (trackerName: TrackerName): ImageSourcePropType =>
  TRACKER_ICONS[trackerName];

export const getStatusLabel = (status: string): string | undefined =>
  getStatusLabels()[status as UserListStatus];

export const getMyAnimeListScoreLabel = (score: number): string =>
  `(${score}) ${getMalScores()[score]}`;

export const getAniListScoreFormatting = (
  scoreFormat: ScoreFormat,
  shorten?: boolean,
): ScoreFormatting => {
  switch (scoreFormat) {
    case 'POINT_100':
      return {
        count: 101,
        label: score => (score ? score.toLocaleString() : '-'),
      };
    case 'POINT_10_DECIMAL':
      return {
        count: 101,
        label: score => (score ? (score / 10).toLocaleString() : '-'),
      };
    case 'POINT_10':
      return {
        count: 11,
        label: score => (score ? score.toLocaleString() : '-'),
      };
    case 'POINT_5':
      return {
        count: 6,
        label: score => {
          if (shorten) {
            return score ? `${score}★` : '-';
          }
          return '★'.repeat(score) || '-';
        },
      };
    case 'POINT_3':
      return {
        count: 4,
        label: score => {
          switch (score) {
            case 0:
              return '-';
            case 1:
              return '☹️';
            case 2:
              return '😐';
            case 3:
              return '😃';
            default:
              return '-';
          }
        },
      };
  }
};

/**
 * Kitsu uses a 0.5-10 scale (displayed as half-increments).
 * Internally stored as ratingTwenty (2-20), displayed as ratingTwenty/2.
 * This provides 21 options: 0 (no score), 0.5, 1.0, 1.5, ... 10.0
 */
export const getKitsuScoreFormatting = (): ScoreFormatting => {
  return {
    count: 21,
    label: score => {
      if (score === 0) {
        return '-';
      }
      /* Convert index to Kitsu's half-point scale (0.5-10) */
      const displayScore = score / 2;
      return displayScore.toLocaleString(undefined, {
        minimumFractionDigits: displayScore % 1 === 0 ? 0 : 1,
        maximumFractionDigits: 1,
      });
    },
  };
};

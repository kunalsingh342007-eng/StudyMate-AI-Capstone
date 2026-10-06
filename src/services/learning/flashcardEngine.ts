import { Flashcard, FlashcardRating } from '../../types';

export const FlashcardEngine = {
  /**
   * Calculates next spaced review interval using modified SuperMemo (SM-2) algorithm
   */
  calculateNextReview(
    card: Flashcard,
    rating: FlashcardRating
  ): {
    intervalDays: number;
    repetitions: number;
    easeFactor: number;
    nextReviewDate: string;
    dueStatus: 'due' | 'upcoming' | 'mastered';
  } {
    let { intervalDays, repetitions, easeFactor } = card;

    if (rating === 'Again') {
      // Failed recall - reset cycle
      repetitions = 0;
      intervalDays = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else {
      // Successful recall
      if (repetitions === 0) {
        intervalDays = rating === 'Hard' ? 1 : rating === 'Good' ? 2 : 3;
      } else if (repetitions === 1) {
        intervalDays = rating === 'Hard' ? 3 : rating === 'Good' ? 5 : 7;
      } else {
        // Multiplier based on easeFactor
        const modifier = rating === 'Hard' ? 1.1 : rating === 'Good' ? easeFactor : easeFactor * 1.3;
        intervalDays = Math.max(intervalDays + 1, Math.round(intervalDays * modifier));
      }

      repetitions += 1;

      // Adjust easeFactor
      if (rating === 'Hard') {
        easeFactor = Math.max(1.3, easeFactor - 0.15);
      } else if (rating === 'Easy') {
        easeFactor = Math.min(2.8, easeFactor + 0.15);
      }
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    const nextReviewDate = nextDate.toISOString().split('T')[0];

    const dueStatus: 'due' | 'upcoming' | 'mastered' =
      intervalDays >= 21 ? 'mastered' : 'upcoming';

    return {
      intervalDays,
      repetitions,
      easeFactor: Number(easeFactor.toFixed(2)),
      nextReviewDate,
      dueStatus,
    };
  },

  /**
   * Sorts cards prioritizing due cards first, then weak/low repetition cards
   */
  prioritizeCards(cards: Flashcard[]): Flashcard[] {
    const today = new Date().toISOString().split('T')[0];
    return [...cards].sort((a, b) => {
      const aDue = a.nextReviewDate <= today;
      const bDue = b.nextReviewDate <= today;
      if (aDue && !bDue) return -1;
      if (!aDue && bDue) return 1;
      return a.repetitions - b.repetitions;
    });
  },
};

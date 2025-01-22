import { Builder } from 'builder-pattern';
import { Id } from '../vo/id';
import { Selector } from '../vo/selector';
import { Span } from '../vo/span';
import { Timestamp } from '../vo/timestamp';
import { Url } from '../vo/url';

export class Highlight {
  id?: Id;
  userId!: Id;
  targetUrl!: Url;
  selector!: Selector;
  spans!: Span[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  deletedAt?: Timestamp;

  mergeSpans(): Highlight {
    const sortedSpans = [...this.spans].sort(
      (a, b) => a.value.start - b.value.start,
    );

    // 병합된 spans를 저장할 배열
    const mergedSpans: Span[] = [];

    for (const curSpan of sortedSpans) {
      const lastMergedSpan = mergedSpans[mergedSpans.length - 1];

      if (!lastMergedSpan) {
        mergedSpans.push(curSpan);
        continue;
      }

      const lastSpanEnd =
        lastMergedSpan.value.start +
        lastMergedSpan.value.text.length;

      // 현재 span이 이전 span과 겹치거나 인접한 경우
      if (curSpan.value.start <= lastSpanEnd) {
        const newSpan = Span.create({
          start: Math.min(
            lastMergedSpan.value.start,
            curSpan.value.start,
          ),
          text:
            lastMergedSpan.value.text.substring(
              0,
              curSpan.value.start - lastMergedSpan.value.start,
            ) + curSpan.value.text,
        });

        // 마지막 span을 새로운 병합된 span으로 교체
        mergedSpans[mergedSpans.length - 1] = newSpan;
      } else {
        mergedSpans.push(curSpan);
      }
    }

    const newHighlight = Builder(Highlight)
      .id(this.id)
      .userId(this.userId)
      .targetUrl(this.targetUrl)
      .selector(this.selector)
      .spans(mergedSpans)
      .createdAt(this.createdAt)
      .updatedAt(this.updatedAt)
      .deletedAt(this.deletedAt)
      .build();

    return newHighlight;
  }
}

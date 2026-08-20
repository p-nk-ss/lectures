import type { ComponentChildren } from 'preact';

/** Drives the sprite animations; one mood per beat of the exchange. */
export type Mood = 'idle' | 'talk' | 'ok' | 'bad' | 'win' | 'lose';

interface Props { mood: Mood; hud?: ComponentChildren }

/**
 * The ward backdrop with the two characters standing in it. The sprites are wrapped so the
 * bob keyframes can own `transform` on the wrapper without fighting anything on the image.
 */
export default function Scene({ mood, hud }: Props) {
  return (
    <div class="scene" data-mood={mood}>
      {hud && <div class="scene-hud">{hud}</div>}
      <span class="actor doctor">
        <img src="/images/quiz/doctor.png" alt="" width="208" height="215" />
      </span>
      <span class="actor student">
        <img src="/images/quiz/student.png" alt="" width="229" height="322" />
      </span>
    </div>
  );
}

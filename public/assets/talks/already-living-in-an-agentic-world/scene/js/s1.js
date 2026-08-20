/* ──────────────────────────────────────────────────────────────────────────
   Scene 1 · The LLM · the counter

   A language model on its own answers, and answering is the whole of what it
   does. The man brings the whole of his own material to a counter and asks; one
   thin page comes back. He does it three times, and the three pages are
   identical, because he had to hand over the whole thing again each time and
   nothing was carried forward.

   TWO THINGS ARE LOAD-BEARING and both are visible in the code below.

   CLANK NEVER TOUCHES ANYTHING. He never takes a step and never changes pose
   for ten beats; his entire performance is two dots changing colour. That is
   the baseline every later scene pushes against, so when he physically lifts a
   carboy in scene 3 the room feels the change.

   THE TWO SIDES OF THE COUNTER DIVERGE. His side accumulates, one card at a
   time; the machine's side is identical every time the light goes out. Beats 1,
   4, 7 and 10 are the same numbers apart from the row of cards on the floor,
   and that asymmetry is the whole argument: absence is not legible, but a
   growing row against an unchanging one is.

   THE ROOM IS NINE TILES BY FIVE, and it holds nothing that is not the story.
   The brief's plan was drawn on 20 x 11 and none of its columns survive, but
   everything it asked to be true does: the counter is the only thing between
   them, they share a column so both face each other head-on, neither ever
   crosses it, the bundle is at the near end and the answers at the far end, and
   the answers PILE UP on his side, each one three pixels right and down of the
   one under it, so what grows is a stack rather than a row. Every move in the
   scene is exactly one tile, and the camera never moves at all.
   ────────────────────────────────────────────────────────────────────────── */
window.act1.scene('s1', 'bare', (S) => {
  const { DOWN, LEFT, UP } = window.act1;

  // ── The room, which is deliberately small ───────────────────────────────
  // NINE TILES BY FIVE, and nothing in it that is not the story. A bigger room
  // dressed with furniture reads as a big room with things in it; a small room
  // reads as small. Everything here is used by a beat.
  //
  // The counter runs across (2,3) to (4,3), so its centre is column 3. Nothing
  // but paper ever crosses it and neither character ever leaves their tile.
  S.prop('counter', 'counter', 3, 2);

  // Clank stands half a tile behind the counter, facing straight out at the
  // room. That facing is deliberate and it costs something: the man is seen
  // only from behind for the whole scene. It is worth it because with four
  // facings two characters can face each other only along a shared row or
  // column, and this is the choice between Clank showing one eye in profile and
  // showing two head-on. Scene 1 is where amber-means-working is taught to the
  // whole act, so it is taught on the strongest view of the signal.
  S.actor('clank', 'clank', 3, 1.45, DOWN);
  // The man starts OFF THE RIGHT EDGE and walks in. The room opens with the
  // machine and its counter and nothing else, so the audience meets a situation
  // beginning rather than a tableau already arranged.
  S.actor('human', 'human', 9, 3, LEFT);

  // His material, which appears beside him when he arrives rather than being
  // there before him: he brings the context, which is the whole point. And the
  // cards are one PNG drawn three times, which IS the argument of the scene, so
  // they are declared together rather than as three separate props.
  S.prop('bundle', 'context-bundle', 2, 3, { hidden: true });
  // All three start stacked on the tile the answer appears on and are revealed
  // one at a time, so every card enters the scene from the same place.
  S.many('card', 'answer-card', [[4, 2], [4, 2], [4, 2]], { hidden: true });

  // ── The beats ───────────────────────────────────────────────────────────
  S.beat('The machine stands behind its counter, and there is nothing else in '
       + 'the room.');

  S.beat('A man comes in, stops at the counter, and puts his material down '
       + 'beside him.', (b) => {
    // In from off the right edge, then turned to face the machine across the
    // counter. He does the walking, which is what says who works for whom.
    b.walk('human', [3, 3]);
    b.face('human', UP);
    // His material lands with him, not before him.
    b.show('bundle');
  });

  S.beat('He lifts the whole bundle onto the counter, and asks.', (b) => {
    // Arms up in front of him. Never the work sheet: that is the one pose of
    // his without visible legs.
    b.pose('human', 'carry');
    b.put('bundle', 2, 2);
    b.say('human');
  });

  S.beat('It answers: its eyes come on, it speaks, and a second later one thin '
       + 'page is on the counter.', (b) => {
    b.quiet('human');
    b.pose('human', 'walk');
    // THE MACHINE IS ONLY AWAKE WHILE IT IS PRODUCING. It stays dark through
    // the whole of the asking, comes on here, and goes out again as soon as the
    // page is handed over. Nothing else in the act says "working" at all.
    b.eyes('clank', true);
    b.say('clank');
    // The page is the finished output, so it arrives AFTER he has been speaking
    // for a second rather than at the same instant. Both then hold until the
    // next click, with the speech still running.
    b.change('card1', { o: 1, delay: 1000 });
    b.hold(2000);
  });

  S.beat('The light goes out. The bundle comes back down and he keeps the page.', (b) => {
    b.quiet('clank');
    b.eyes('clank', false);
    b.put('bundle', 2, 3);
    b.put('card1', 4, 3);
  });

  S.beat('Second time. The same bundle onto the same counter, and the same ask.', (b) => {
    b.pose('human', 'carry');
    b.put('bundle', 2, 2);
    b.say('human');
  });

  S.beat('It answers again, with nothing carried over from the first time.', (b) => {
    b.quiet('human');
    b.pose('human', 'walk');
    b.eyes('clank', true);
    b.say('clank');
    b.change('card2', { o: 1, delay: 1000 });
    b.hold(2000);
  });

  S.beat('Out again. Bundle back, and the second page lands on the first.', (b) => {
    b.quiet('clank');
    b.eyes('clank', false);
    b.put('bundle', 2, 3);
    // Three pixels right and down, so the pile reads as a pile rather than as a
    // page that moved.
    b.put('card2', 4, 3, { nudge: [3, 3] });
  });

  S.beat('Third time. The same bundle, the same counter, the same lift.', (b) => {
    b.pose('human', 'carry');
    b.put('bundle', 2, 2);
    b.say('human');
  });

  S.beat('It answers a third time.', (b) => {
    b.quiet('human');
    b.pose('human', 'walk');
    b.eyes('clank', true);
    b.say('clank');
    b.change('card3', { o: 1, delay: 1000 });
    b.hold(2000);
  });

  S.beat('Out a final time, and the third page joins the pile.', (b) => {
    b.quiet('clank');
    b.eyes('clank', false);
    b.put('bundle', 2, 3);
    b.put('card3', 4, 3, { nudge: [6, 6] });
    // NO CAMERA MOVE, here or anywhere. The last frame is the first frame with a
    // pile on one side of the counter: the machine is exactly as it was, and
    // everything that accumulated is on his side of it.
  });
}, { cols: 9, rows: 5 });

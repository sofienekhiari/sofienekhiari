/* ──────────────────────────────────────────────────────────────────────────
   Scene 2 · An agent, doing the job it was given

   ONE ROUND, AND NOTHING GOES WRONG IN IT. A man comes in, asks for the plants
   to be watered, and Clank waters them and reports back. That is the whole
   scene, and its plainness is the point: it is the picture Sofiene talks over
   while he defines what an agent is and what autonomy means.

   THE SICK PLANT USED TO BE HERE AND IS NOT ANY MORE. This scene once ran the
   round twice, the second time with a plant that could not be helped, and the
   scene after it gave the machine the medicine. Both of those moved fifteen
   slides later, to sit immediately before the connectors, so that what a new
   capability does is shown at the moment it is being explained rather than
   twenty minutes earlier. What is left here is the first, clean round.

   FIFTEEN BEATS, AND THE FIFTEENTH IS NOT IN THE ROOM. The scene's own story
   ends at beat 14, on exactly the picture it opened with. Beat 15 changes
   nothing in the room and instead opens the slide: the panel slides left and
   the agentic loop appears beside it, which is the moment in his script where
   he stops narrating the picture and starts naming the mechanism.

   NO NUMBER HERE WAS MEASURED OFF AN ARRANGEMENT, with one stated exception.
   Where the plants stand and where the can hangs to pour are worked out from
   the sizes of the pictures themselves; the only pixel figures written down are
   where the spout's mouth sits on the can, which is a fact about that drawing,
   and OFF_WALL, which is a preference and says so.
   ────────────────────────────────────────────────────────────────────────── */
window.act1.scene('s2', 'bare', (S) => {
  const { DOWN, LEFT, RIGHT, UP } = window.act1;

  // ── The rules this room is laid out by ──────────────────────────────────
  // How big a tile is, which is also how tall a character is: they stand with
  // their feet on the tile centre and reach one whole tile up from it.
  const TILE = window.motion.TILE;
  // How wide the plant's picture is. It is square, so this is its height too,
  // and it is read off the catalogue rather than typed, so regenerating the
  // sprite at another size moves every plant in the scene by itself.
  const PLANT = window.act1.asset('pot-alive').w;
  // His widest sheet, which is the one he waters on. Taking the widest rather
  // than the one he happens to be standing in means nothing can ever poke into
  // him when he changes pose.
  const WIDE = window.act1.asset('clank-work').w;
  // How long the falling water is, read off its own sprite for the same reason.
  const BAR = window.act1.asset('liquid-pour').h;
  // WHERE THE SPOUT'S MOUTH IS, measured from the middle of the can's picture.
  // The can is drawn tipping to its right, so the water always leaves it low and
  // to the right whichever way its carrier is turned. That is a fact about the
  // sprite rather than about any one plant, which is exactly why it can place
  // the can at all three of them.
  const SPOUT = [29, 16];
  // HOW FAR THE CAN IS PULLED BACK from the plant it is emptying into: the
  // spout's whole sideways reach, ALWAYS, because water falls straight down and
  // where the mouth is over is where the water goes.
  const BACK = -SPOUT[0];
  // HOW FAR THE TOP PLANT IS DROPPED off the back wall, in pixels. The geometry
  // alone puts it hard against the join row, where it reads as growing out of
  // the wall rather than standing on the floor. A preference, and the only
  // number here that is not derived from a picture's own size.
  const OFF_WALL = 12;

  // HOW FAR HIS OWN PICTURE REACHES from the tile he is standing on, by the way
  // he is facing. A whole tile upwards, because he is one tile tall and stands
  // on the bottom of himself; half his width to either side; and nothing at all
  // below his feet, because nothing of him is drawn there.
  const REACH = { [DOWN]: 0, [LEFT]: WIDE / 2, [RIGHT]: WIDE / 2, [UP]: TILE };
  // Which way each facing points, as one step across the floor.
  const STEP = { [DOWN]: [0, 1], [LEFT]: [-1, 0], [RIGHT]: [1, 0], [UP]: [0, -1] };

  /** Where a plant stands, given the tile he stops on and the way he faces it.
   *
   * A plant sits clear of that tile by half its own picture plus however far his
   * picture reaches in that direction, so the two just touch and neither ever
   * paints over the other. It is a function rather than three placements because
   * the answer is genuinely different in each direction: he stands ON his tile
   * and hangs a whole tile above it, so a plant he faces upwards has to be a tile
   * and a half away to clear his head, while one below his feet needs only half
   * its own width.
   *
   * Args:
   *   stop: The [column, row] he stops on to reach it.
   *   face: Which way he is turned when he gets there.
   *
   * Returns:
   *   The [column, row] the plant stands on, which may be fractional.
   *
   * Example:
   *   beyond([6, 2], UP)  // [6, 0.4375] — a tile and a half above him
   */
  function beyond(stop, face) {
    const [ax, ay] = STEP[face];
    // Half the plant, plus his own reach, turned from pixels back into tiles.
    const away = (PLANT / 2 + REACH[face]) / TILE;
    return [stop[0] + ax * away, stop[1] + ay * away];
  }

  // ── The room, which holds nothing that is not the story ─────────────────
  // Home is the top left corner of the circuit and the man stands outside it on
  // the far side. They begin ADJACENT, exactly as scene 1 does, so the opening
  // picture has no walking in it and can be returned to.
  const HOME = [2, 2];
  // Where the man stands to give the round, and where he comes from. He is off
  // the left edge to start, which is a tile outside a nine-tile room, so he is
  // simply not in the picture rather than being hidden and revealed.
  const MAN = [1, 2];
  const WINGS = [-1, 2];
  // The three plants: the tile he stops on to reach each, and the way he is
  // facing when he gets there. Written once, and every beat, every plant and
  // every pour in the scene is read out of it. The four stopping tiles are the
  // four corners of one rectangle, which is what lets any order be walked.
  const ROUND = [[[2, 3], DOWN], [[6, 3], RIGHT], [[6, 2], UP]];

  // Where the three plants therefore stand. Only the one he faces UPWARDS is
  // adjusted, because it is the only one with a wall behind it.
  const PLANTS = ROUND.map(([stop, face]) => {
    const [col, row] = beyond(stop, face);
    return face === UP ? [col, row + OFF_WALL / TILE] : [col, row];
  });
  // Where the water lands: the middle of each plant. Each stream is declared on
  // that spot and never moves off it, so a stream is only ever growing or
  // shrinking and cannot slide sideways while it is too small to see.
  const WATER = PLANTS;

  /** The tiles a walk between two stopping places goes through.
   *
   * The four places he ever stands are the four corners of one rectangle, so any
   * two of them are either in line, which is one straight leg, or diagonal,
   * which is two legs round a corner that is itself one of the four. Turning
   * along the column he is already on always lands on such a corner.
   *
   * Args:
   *   from: The [column, row] he is leaving.
   *   to: The [column, row] he is going to.
   *
   * Returns:
   *   The waypoints to hand to walk(), the destination last.
   *
   * Example:
   *   legs([6, 2], [2, 3])  // [[6, 3], [2, 3]] — down the side, then across
   */
  function legs(from, to) {
    if (from[0] === to[0] || from[1] === to[1]) return [to];
    return [[from[0], to[1]], to];
  }

  // ── The set, declared in the order it stacks ────────────────────────────
  // The three plants, one picture drawn three times. Three of the same thing is
  // itself a statement that the round is uniform.
  S.many('pot', 'pot-alive', PLANTS);

  // The watered state: one small dark disc per plant, declared after every pot
  // so it draws over the plant rather than under it. KNOWN WEAK ON A HEALTHY
  // PLANT and left that way on purpose: seen from overhead a healthy pot is
  // leaves edge to edge with no soil showing, so the disc reads as a dark centre
  // rather than as wet earth. It is kept because it is the only evidence left
  // standing once he has walked away that the round actually ran.
  S.many('soil', 'soil-wet', PLANTS, { hidden: true });

  // The falling water, one bar per plant, declared after the soil so it is drawn
  // over the wet disc rather than under it. Each is parked WHERE ITS OWN WATER
  // LANDS at no size at all, which is where the water ends up rather than where
  // it comes from: a pour grows it upwards to the mouth of the spout, and the
  // end of a pour shrinks it back into the ground it soaked into.
  S.many('pour', 'liquid-pour', WATER, { start: { s: 0 } });

  // Home. CLANK FACES DOWN and his hands are empty, which is the resting state
  // this scene opens and closes on. He is declared on the WALK sheet because
  // that is the arms-down picture, and arms only come up when there is
  // something in them.
  S.actor('clank', 'clank', HOME[0], HOME[1], DOWN, { pose: 'walk' });
  // The man, waiting off stage until he walks in. Status is said by who does
  // the walking: Clank covers ten tiles and the man covers four.
  S.actor('human', 'human', WINGS[0], WINGS[1], RIGHT);

  // The can, which does not exist until he is given the job and stops existing
  // when he hands it back. Declared LAST of everything in the room, so that
  // wherever it shares a floor line with something else it wins the tie and is
  // drawn in front: that is what puts it over the plant and its water on every
  // pour beat, since a pour stands it on the plant's own tile.
  S.prop('can', 'can-upright', HOME[0], HOME[1], { hidden: true });

  /** One plant being watered, wherever it stands and whichever way he faces it.
   *
   * THE CAN IS PLACED FROM THE PLANT'S OWN TILE, not from a nudge measured
   * against him, because water falls straight down and so the spout has to be
   * over the plant however he got there.
   *
   * Args:
   *   b: The beat being written.
   *   n: Which plant, counting from one in the order they are declared.
   */
  function waters(b, n) {
    const [col, row] = PLANTS[n - 1];
    // Hands to working height. The engine rests a character on the middle
    // column, which on the work sheet is the held pose rather than a gesture
    // caught halfway.
    b.pose('clank', 'work');
    // The can turns over in his hands.
    b.state('can', 'can-tipped');
    // High enough over the plant that the mouth of the spout hangs one stream
    // above the soil, and pulled back towards him by the spout's whole reach.
    b.put('can', col, row, { lift: BAR + SPOUT[1], nudge: [BACK, 0] });
    // The water rises from the soil to the mouth and grows to full size. Half
    // its own length up puts its foot on the soil and its head at the mouth.
    b.put(`pour${n}`, WATER[n - 1][0], WATER[n - 1][1], { lift: BAR / 2 })
     .change(`pour${n}`, { s: 1 });
    // The soil goes dark under the plant, which is the only evidence left once
    // he has walked away.
    b.show(`soil${n}`);
  }

  /** The end of a pour: hands back up, the can righted, the water soaked away.
   *
   * Always in the same beat as the leg that takes him off to the next plant, so
   * the round never spends a click on tidying up.
   *
   * Args:
   *   b: The beat being written.
   *   n: Which plant he is leaving.
   */
  function dries(b, n) {
    // Hands back up in front of him, which is both how he carries and how he
    // walks: the carry sheet has legs, so nothing has to say he sets off.
    b.pose('clank', 'carry');
    // He rights the can, so it is upright for every travelling beat and tipped
    // only over a plant.
    b.state('can', 'can-upright');
    // The last of the water drops into the soil, well before he is clear of the
    // plant. Back to the spot it was declared on, so it shrinks straight down
    // into the soil rather than sliding as it goes.
    b.put(`pour${n}`, WATER[n - 1][0], WATER[n - 1][1]).change(`pour${n}`, { s: 0 });
  }

  // ── He is standing there, and nobody has asked for anything ─────────────
  S.beat('An empty room. Clank stands on his home tile facing out, hands empty. '
       + 'Nothing is running and nobody has asked for anything.');

  S.beat('The man comes in and stops beside him. Clank has not noticed: he is '
       + 'still facing the room with his hands empty.', (b) => {
    b.walk('human', MAN);
  });

  S.beat('The man asks him to water the plants. Only now does Clank turn to '
       + 'face him.', (b) => {
    b.say('human');
    // The turn happens ON the beat the man starts speaking, which is what makes
    // it read as a response to being addressed rather than as a machine that
    // happened to be looking the right way.
    b.face('clank', LEFT);
  });

  S.beat('The man stops. Clank answers him.', (b) => {
    b.quiet('human');
    b.say('clank');
  });

  S.beat('Clank stops talking, and the watering can appears in his hands.', (b) => {
    b.quiet('clank');
    // Shown and taken up in the same beat: the can exists because there is now
    // a job. carry() brings his arms up by itself, so nothing here has to say
    // which sheet he is on.
    b.show('can');
    b.carry('clank', 'can');
    b.state('can', 'can-upright');
  });

  // ── The round: three plants, in the order he takes them ─────────────────
  // Where he is standing as the round is written, so each leg is routed from the
  // last stop rather than from a table of legs typed out by hand.
  let at = HOME;
  [1, 2, 3].forEach((n, i) => {
    const [stop, face] = ROUND[n - 1];
    S.beat(i === 0 ? 'He sets off, and goes to the first plant.'
                   : 'He walks to the next one.', (b) => {
      // The plant he is leaving finishes draining in the same beat he leaves.
      if (i > 0) dries(b, [1, 2, 3][i - 1]);
      b.walk('clank', ...legs(at, stop));
      // Facing on arrival is the direction of the last leg, which is only the
      // way the plant lies for some of the orders, so it is set outright.
      b.face('clank', face);
    });
    at = stop;
    S.beat('He waters it.', (b) => waters(b, n));
  });

  S.beat('He walks back to the man, the job done.', (b) => {
    dries(b, 3);
    b.walk('clank', ...legs(at, HOME));
    // Home is beside the man, so he arrives already turned to him whichever way
    // the last leg ran.
    b.face('clank', LEFT);
  });

  S.beat('He sets the can down and tells him it is done.', (b) => {
    // drop() empties his hands, which puts his arms back down by itself.
    b.drop('clank', 'can', HOME[0], HOME[1]);
    b.hide('can');
    b.say('clank');
  });

  S.beat('The man goes away, because the task is finished, and Clank turns back '
       + 'to face the room, exactly as he was before any of it started.', (b) => {
    b.quiet('clank');
    b.walk('human', WINGS);
    b.face('clank', DOWN);
  });

  // ── And then the slide opens, which is not a thing in the room ──────────
  // NOTHING HERE MOVES. The beat exists so there is a click at the point in his
  // script where he stops describing the picture and starts naming the loop; the
  // slide reads the beat number and slides the panel aside for the diagram.
  // Written as a beat rather than as a separate slide because the picture has to
  // stay on screen while he maps the loop onto it, one stage at a time.
  S.beat('Nothing moves. The panel slides left and the loop appears beside it, '
       + 'which is where the talking stops being about plants.');

}, { cols: 9, rows: 5 });

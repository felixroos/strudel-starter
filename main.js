import { evaluate, evalScope } from '@strudel.cycles/eval';
import { Scheduler, getAudioContext } from '@strudel.cycles/webaudio';
import { loadWebDirt } from '@strudel.cycles/webdirt';
import controls from '@strudel.cycles/core/controls.mjs';

// import desired modules and add them to the eval scope
await evalScope(
  import('@strudel.cycles/core'),
  import('@strudel.cycles/mini'),
  import('@strudel.cycles/osc'),
  import('@strudel.cycles/webdirt'),
  controls,
  // import other strudel packages here
); // add strudel to eval scope

let scheduler;
let initialized = false;

// eval + start on button click
document.getElementById('start').addEventListener('click', async () => {
  if (!initialized) {
    const audioContext = getAudioContext();
    const latency = 0.2;

    // load default samples + init webdirt
    loadWebDirt({
      audioContext,
      latency,
      sampleMapUrl: 'https://strudel.tidalcycles.org/EmuSP12.json',
      sampleFolder: 'https://strudel.tidalcycles.org/EmuSP12/',
    });

    // the scheduler will query the pattern within the given interval
    scheduler = new Scheduler({
      audioContext,
      interval: 0.1,
      latency,
      onEvent: (hap) => {
        /*     const delta = hap.whole.begin - audioContext.currentTime;
        console.log('delta', delta); */
        // when using .osc or .webdirt, each hap will have context.onTrigger set
        // if no onTrigger is set, try to play hap.value as frequency with a cheap oscillator
        if (!hap.context.onTrigger && typeof (hap.value) === "number") {
          // console.log('e', e.show());
          const oscillator = audioContext.createOscillator();
          const master = audioContext.createGain();
          master.gain.value = 0.1;
          master.connect(audioContext.destination);
          oscillator.type = 'sawtooth';
          oscillator.frequency.value = hap.value;
          oscillator.connect(master);
          oscillator.start(hap.whole.begin);
          oscillator.stop(hap.whole.end);
        }
      },
    });

    initialized = true;
  }

  const { pattern } = await evaluate(
    // 's("bd sd").osc()', // need to run sclang + osc server (npm run osc in strudel root)
    `stack(
      s("bd(3,8),hh*4,~ sd").webdirt(),
    ).slow(1)`,
    // `stack(
    //   "c3@3 [eb3, g3, [c4 d4]/2]",
    //   "c2 g2",
    //   "[eb4@5 [f4 eb4 d4]@3] [eb4 c4]/2".slow(8)
    // )`,
  );
  scheduler.setPattern(pattern);
  scheduler.start();
});

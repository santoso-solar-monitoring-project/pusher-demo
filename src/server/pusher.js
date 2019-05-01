import Pusher from 'pusher';
import { sleep } from './utils';
import M from 'moment-timezone';
M.tz.setDefault('America/Chicago');

var pusher = new Pusher({
  appId: '651114',
  key: '9dfb7224d7fd60cc9c5f',
  secret: '958b9a4ad341c43ade27',
  cluster: 'us2',
  encrypted: true,
});

const sample_rate = 2; // Hz
const buf_interval = 4; // second
const buf_size = Math.round(buf_interval * sample_rate); // samples

async function* SampleData({
  sample_rate, // Hz
  t0 = Date.now() / 1000, // seconds
  sine_freq = 1, // Hz
  random = true,
} = {}) {
  random = random ? Math.random : () => 1;
  const ang_freq = 2 * Math.PI * sine_freq; // radians/second
  while (true) {
    const x = Date.now(); // milliseconds
    const y = Math.sin((ang_freq * x) / 1000);
    const wait = ((2 * random() + 1) / sample_rate) * 1000;
    // wait this long to generate a sample
    await sleep(wait);
    yield [x, y];
  }
}

async function main(channels) {
  const sample_data = SampleData({ sample_rate });
  while (true) {
    const payload = [];
    for (let i = 0; i<buf_size; i++) {
      const point = (await sample_data.next()).value;
      payload.push(point);
    }

    const events = channels.map((channel,i)=>
    {
      const p = payload.map(pair=> [pair[0], pair[1]+i])
      console.log(
        `${M().format('LTS')} | ${channel} | new-data triggered!\n`,
        p
      );
      return {
        channel,
        name: "new-data",
        data: { payload:p }
      };
    });

    pusher.triggerBatch(events);
  }
}

const channels =
  process.argv.length > 2 ? process.argv.slice(2) : ['sine-wave'];

main(channels);

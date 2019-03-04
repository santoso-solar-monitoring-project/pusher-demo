import Pusher from 'pusher';
import { sleep } from './utils';

var pusher = new Pusher({
  appId: '651114',
  key: '9dfb7224d7fd60cc9c5f',
  secret: '958b9a4ad341c43ade27',
  cluster: 'us2',
  encrypted: true,
});

const sample_rate = 10; // Hz
const buf_interval = 0.4; // second
const buf_size = buf_interval * sample_rate; // samples

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

async function main(channelName) {
  const sample_data = SampleData({ sample_rate });
  while (true) {
    const payload = [];
    for (const _ in [...Array(buf_size)]) {
      const point = (await sample_data.next()).value;
      payload.push(point);
    }
    pusher.trigger(channelName, 'new-data', { payload });

    console.log(
      `${new Date().toLocaleTimeString()} | ${channelName} | new-data triggered!\n`,
      payload
    );
  }
}

const channels =
  process.argv.length > 2 ? process.argv.slice(2) : ['sine-wave'];

channels.forEach(ch => main(ch));

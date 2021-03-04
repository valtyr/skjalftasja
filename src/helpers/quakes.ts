export default async () => {
  const query = {
    start_time: '2021-02-25 00:39:00',
    end_time: '2021-03-04 00:39:00',
    depth_min: 0,
    depth_max: 25,
    size_min: 0,
    size_max: 7,
    magnitude_preference: ['Mlw', 'Autmag'],
    event_type: ['qu'],
    originating_system: ['SIL picks'],
    area: [
      [68, -32],
      [61, -32],
      [61, -4],
      [68, -4],
    ],
    fields: [
      'event_id',
      'lat',
      'long',
      'time',
      'magnitude',
      'event_type',
      'originating_system',
      'depth',
    ],
  };

//   const res = await fetch('http://localhost:8080/skjalftalisa/v1/quake/array/', { method: 'post', body: JSON.stringify(query)});
  const res = await fetch('https://api.vedur.is/skjalftalisa/v1/quake/array/', { method: 'post', body: JSON.stringify(query)});
  const data: {
    event_id: string[],
    event_type: string[],
    lat: number[],
    long: number[],
    magnitude: number[],
    originating_system: string[],
    time: number[],
    depth: number[],
  } = (await res.json()).data;

  return data.event_id.map((item, i) => ({
    id: item,
    type: data.event_type[i],
    lat: data.lat[i],
    long: data.long[i],
    m: data.magnitude[i],
    system: data.originating_system[i],
    time: data.time[i],
    depth: data.depth[i],
  }))
};

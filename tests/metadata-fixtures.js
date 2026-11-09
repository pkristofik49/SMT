/* Generated EXIF, GPS, XMP, IPTC, unknown-tag, and thumbnail fixtures. */
(function () {
  const ascii = value => Uint8Array.from(value, character => character.charCodeAt(0));
  const join = (...parts) => {
    const output = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
    let offset = 0;
    for (const part of parts) { output.set(part, offset); offset += part.length; }
    return output;
  };
  function segment(marker, payload) {
    const length = payload.length + 2;
    return join(new Uint8Array([255, marker, length >> 8, length & 255]), payload);
  }
  function tiff() {
    const buffer = new ArrayBuffer(2048);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    bytes.set([73, 73, 42, 0]);
    view.setUint32(4, 8, true);
    const ifd0 = 8;
    const ifd1 = ifd0 + 2 + 6 * 12 + 4;
    const exif = ifd1 + 2 + 2 * 12 + 4;
    const gps = exif + 2 + 5 * 12 + 4;
    let cursor = gps + 2 + 7 * 12 + 4;
    const text = (tag, value) => ({ tag, type: 2, count: value.length + 1, bytes: ascii(value + '\0') });
    const number = (tag, value) => ({ tag, type: 4, count: 1, value });
    const raw = (tag, value, type = 7) => ({ tag, type, count: value.length, bytes: Uint8Array.from(value) });
    const rational = (tag, values) => {
      const data = new Uint8Array(values.length * 8);
      const dataView = new DataView(data.buffer);
      values.forEach(([numerator, denominator], index) => {
        dataView.setUint32(index * 8, numerator, true);
        dataView.setUint32(index * 8 + 4, denominator, true);
      });
      return { tag, type: 5, count: values.length, bytes: data };
    };
    function writeIfd(offset, entries, next = 0) {
      view.setUint16(offset, entries.length, true);
      entries.sort((left, right) => left.tag - right.tag).forEach((entry, index) => {
        const position = offset + 2 + index * 12;
        view.setUint16(position, entry.tag, true);
        view.setUint16(position + 2, entry.type, true);
        view.setUint32(position + 4, entry.count, true);
        if (entry.value !== undefined) view.setUint32(position + 8, entry.value, true);
        else if (entry.bytes.length <= 4) bytes.set(entry.bytes, position + 8);
        else {
          view.setUint32(position + 8, cursor, true);
          bytes.set(entry.bytes, cursor);
          cursor += entry.bytes.length;
          if (cursor % 2) cursor++;
        }
      });
      view.setUint32(offset + 2 + entries.length * 12, next, true);
    }
    writeIfd(ifd0, [number(256, 640), number(257, 480), text(271, 'Fixture Camera'), text(272, 'Fixture Model'), number(34665, exif), number(34853, gps)], ifd1);
    writeIfd(ifd1, [number(256, 160), number(257, 120)]);
    writeIfd(exif, [rational(33434, [[1, 125]]), text(36867, '2026:11:09 10:20:30'), raw(37500, [1, 2, 3, 4, 5, 6]), raw(37510, ascii('ASCII\0\0\0Fixture comment')), text(59999, 'Unknown vendor tag')]);
    writeIfd(gps, [raw(0, [2, 3, 0, 0], 1), text(1, 'N'), rational(2, [[50, 1], [5, 1], [30, 1]]), text(3, 'E'), rational(4, [[14, 1], [25, 1], [0, 1]]), raw(5, [0], 1), rational(6, [[250, 1]])]);
    return bytes.slice(0, cursor);
  }
  function jpeg(base = new Uint8Array([255, 216, 255, 217])) {
    const xmp = '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:tiff="http://ns.adobe.com/tiff/1.0/" tiff:Make="XMP Camera"><dc:description><rdf:Alt><rdf:li xml:lang="x-default">&lt;img src=x onerror=alert(1)&gt;' + 'Long metadata '.repeat(30) + '</rdf:li></rdf:Alt></dc:description></rdf:Description></rdf:RDF></x:xmpmeta>';
    const dataset = (tag, value) => join(new Uint8Array([28, 2, tag, value.length >> 8, value.length & 255]), ascii(value));
    const iptc = join(dataset(5, 'Fixture title'), dataset(25, 'first'), dataset(25, 'second'));
    const size = new Uint8Array(4);
    new DataView(size.buffer).setUint32(0, iptc.length);
    const photoshop = join(ascii('Photoshop 3.0\0'), ascii('8BIM'), new Uint8Array([4, 4, 0, 0]), size, iptc, new Uint8Array(iptc.length % 2));
    return join(base.subarray(0, 2), segment(225, join(ascii('Exif\0\0'), tiff())), segment(225, join(ascii('http://ns.adobe.com/xap/1.0/\0'), ascii(xmp))), segment(237, photoshop), base.subarray(2));
  }
  globalThis.SmallToolsMetadataFixtures = { jpeg, tiff };
})();

import * as Y from "yjs";

function isMap(value: unknown): value is Y.Map<unknown> {
  return value instanceof Y.Map;
}

function isText(value: unknown): value is Y.Text {
  return value instanceof Y.Text;
}

const ydoc = new Y.Doc();
// Disable GC
ydoc.gc = false;

const ydocRemote = new Y.Doc();

function logUpdate(label: string, update: Uint8Array) {
  const encodedUpdate = Buffer.from(update).toString("base64");
  console.log(`${label}: ${encodedUpdate}`);
}

ydoc.on("update", (update) => {
  logUpdate("ydoc update", update);
  Y.applyUpdate(ydocRemote, update);
});

ydocRemote.on("update", (update) => {
  logUpdate("ydocRemote update", update);
  Y.applyUpdate(ydoc, update);
});

const ymap = ydoc.getMap();
ymap.set("keyA", "valueA");
ymap.set("keyB", "valueB1");

const ymapRemote = ydocRemote.getMap();
ymapRemote.set("keyB", "valueB2");
ymapRemote.set("keyC", "valueC");

const nestedMap = new Y.Map();
nestedMap.set("name", "alice");
ymap.set("person", nestedMap);

const nestedMapRemote = ymapRemote.get("person");
if (!isMap(nestedMapRemote)) {
  throw new Error(`Did not find expected Map`);
}
nestedMapRemote.set("age", 32);

const nestedTextRemote = new Y.Text();
ymapRemote.set("content", nestedTextRemote);
nestedTextRemote.insert(0, "Hello, world");

const nestedText = ymap.get("content");
if (!isText(nestedText)) {
  throw new Error(`Did not find expected Text`);
}
nestedText.delete(1, 4);
nestedText.insert(1, "i there");

console.log("ymap:", JSON.stringify(ymap.toJSON()));
console.log("ymapRemote:", JSON.stringify(ymapRemote.toJSON()));

const finalState = Y.encodeStateAsUpdate(ydoc);
logUpdate("final state", finalState);

/**
 * Worker handles storing and retrieving data from the local database. On
 * startup the app will request all card data we have, and then during review
 * it will save updated data post-review. The app itself has no knowledge of
 * stored data except via these messages.
 */
import { makeWorkerFromHandlers } from "../PromiseWorker";
import MessageType from "../shared/MessageType";
import { openDB } from "idb/with-async-ittr";

const dbname = "flashcards";
const dbversion = 1;
const default_difficulty = 200;

const connect = async (appName) =>
  await openDB(dbname, dbversion, {
    upgrade(db) {
      let objstore = db.createObjectStore(appName, {
        keyPath: "id",
        autoIncrement: false,
      });
    },
  });

const handleFetchAll = async ({ appName }) => {
  const db = await connect(appName);
  const cnt = await db.count(appName);
  let data = new Uint32Array(cnt * 4);
  let idx = 0;
  const tx = db.transaction(appName);
  for await (const cursor of tx.store) {
    const value = cursor.value;
    data[idx++] = value.id[0];
    data[idx++] = value.id[1];
    data[idx++] = value.difficulty;
    data[idx++] = value.lastReviewDate;
  }

  const res = {
    data: data.buffer,
  };
  return [res, [res.data]];
};

const getCurrentDateAsNumber = () => {
  const ts = new Date();
  const m = ts.getMonth();
  const d = ts.getDate();
  const y = ts.getFullYear();
  return d + m * 100 + y * 10000;
};

const handleUpdateOnAnswer = async (
  { appName, factId, reviewType },
  correct
) => {
  const db = await connect(appName);
  const oldRecord = await db.get(appName, [factId, reviewType]);
  let difficulty = default_difficulty;
  let lastReviewDate = 0;
  if (oldRecord !== undefined) {
    if (oldRecord.difficulty !== undefined) {
      difficulty = oldRecord.difficulty;
    }
    if (oldRecord.lastReviewDate !== undefined) {
      lastReviewDate = oldRecord.lastReviewDate;
    }
  }
  const currentDate = getCurrentDateAsNumber();
  if (lastReviewDate !== currentDate) {
    lastReviewDate = currentDate;
    const multiplier = correct ? 1.05 : 0.95;
    // Clamp the difficulty between 1 and 1000
    difficulty = Math.min(
      1000,
      Math.max(1, Math.floor(difficulty * multiplier))
    );
    await db.put(appName, {
      id: [factId, reviewType],
      difficulty,
      lastReviewDate,
    });
  }
  return {
    complete: true,
  };
};

onmessage = makeWorkerFromHandlers({
  [MessageType.FETCH_ALL]: handleFetchAll,
  [MessageType.UPDATE_ON_CORRECT]: async (p) =>
    await handleUpdateOnAnswer(p, true),
  [MessageType.UPDATE_ON_INCORRECT]: async (p) =>
    await handleUpdateOnAnswer(p, false),
});

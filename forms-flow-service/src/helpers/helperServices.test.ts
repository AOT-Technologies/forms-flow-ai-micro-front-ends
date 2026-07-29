import moment from "moment";
import HelperServices from "./helperServices";
import { DATE_FORMAT, TIME_FORMAT } from "../constants/constants";

// Oracle: the ORIGINAL two-instance implementation shape that the S.19
// refactor replaced — moment(moment.utc(x).toDate()). Asserting against it
// proves the single-instance formatters produce identical output regardless
// of the machine's timezone.
const legacyLocalMoment = (value: string) =>
  moment(moment.utc(value.replace(" ", "T")).toDate());

const SAMPLES = [
  "2024-01-15 10:30:45",
  "2024-01-15T10:30:45",
  "2025-12-31T23:59:59",
  "2023-06-01T00:00:00",
  "2024-02-29T12:00:00",
];

describe("HelperServices date formatters (S.19 refactor equivalence)", () => {
  test.each(SAMPLES)("getLocalDateAndTime(%s) matches legacy output", (s) => {
    expect(HelperServices.getLocalDateAndTime(s)).toBe(
      legacyLocalMoment(s).format(`${DATE_FORMAT}, ${TIME_FORMAT}`)
    );
  });

  test.each(SAMPLES)("getLocaldate(%s) matches legacy output", (s) => {
    expect(HelperServices.getLocaldate(s)).toBe(
      legacyLocalMoment(s).format(DATE_FORMAT)
    );
  });

  test.each(SAMPLES)("getLocalTime(%s) matches legacy output", (s) => {
    expect(HelperServices.getLocalTime(s)).toBe(
      legacyLocalMoment(s).format(TIME_FORMAT)
    );
  });

  test.each(SAMPLES)("getShortDateAndTime(%s) matches legacy output", (s) => {
    const d = moment.utc(s.replace(" ", "T")).toDate();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    const legacy = `${dd}/${mm}/${yy} ${moment(d).format(TIME_FORMAT)}`;
    expect(HelperServices.getShortDateAndTime(s)).toBe(legacy);
  });

  test("falsy inputs return null", () => {
    expect(HelperServices.getLocalDateAndTime("")).toBeNull();
    expect(HelperServices.getLocaldate("")).toBeNull();
    expect(HelperServices.getLocalTime("")).toBeNull();
    expect(HelperServices.getShortDateAndTime("")).toBeNull();
    expect(HelperServices.getISODateTime(null)).toBeNull();
  });

  test("getISODateTime keeps its existing format", () => {
    const s = "2024-01-15T10:30:45Z";
    expect(HelperServices.getISODateTime(s)).toBe(
      moment(s).format("YYYY-MM-DDTHH:mm:ss.SSSZZ")
    );
  });
});

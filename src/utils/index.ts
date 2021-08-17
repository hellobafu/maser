export default class Util {
	static Parse(string: string | null | undefined) {
		if (!string) return null;
		return "  " + string.replace(/[\r\n]/g, "\n  ");
	}

	static Log(string: string | null | undefined) {
		if (!string) return;
		console.log(Util.Parse(string));
	}

	static TwoLen(input: number, sep = " ") {
		if (!sep.length) throw new Error("Separator must be a non-empty string");

		return input > 10 ? String(input) : sep + String(input);
	}

	static Now(sep = "0") {
		const hours = Util.TwoLen(new Date().getHours(), sep);
		const minutes = Util.TwoLen(new Date().getMinutes(), sep);
		const seconds = Util.TwoLen(new Date().getSeconds(), sep);

		return `${hours}:${minutes}:${seconds}`;
	}

	static Date(time: number | Date, style = "R") {
		if (time instanceof Date) time = time.getTime();
		const seconds = Math.ceil(time / 1000);

		return `<t:${seconds}:${style}>`;
	}
}

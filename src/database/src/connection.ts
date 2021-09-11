import { Clint } from "../../extensions/Clint.js";
import postgres from "pg-promise";

const connectionString = "postgres://postgres:admin@localhost:5432/maser";
const psql = postgres()(connectionString);

export default class Postgres {
	public client: Clint;
	public psql = psql;

	constructor(client: Clint) {
		this.client = client;
	}
}

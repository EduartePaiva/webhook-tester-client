import "dotenv/config";
import { Socket, io } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./types";

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

async function main() {
    try {
        const bearer = await fetch(`${process.env.WEBHOOK_TESTER_URL!}/auth/login`, {
            method: "POST",
            body: JSON.stringify({
                email: process.env.EMAIL!,
                password: process.env.PASSWORD!,
            }),
            headers: {
                "content-type": "application/json; charset=utf-8",
            },
        });
        if (bearer.status != 201) {
            throw new Error(`bearer fetch status: ${bearer.status}, ${await bearer.text()}`);
        }
        const accessToken = (await bearer.json()).accessToken;
        if (typeof accessToken !== "string") {
            throw new Error("could not get accessToken");
        }

        const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
            process.env.WEBHOOK_TESTER_URL!,
            {
                auth: {
                    token: accessToken,
                },
                transports: ["websocket"],
            }
        );
        socket.on("connect_error", (error) => {
            // ...
            console.log("ocorreu um erro: ", error);
        });
        // socket.auth
        console.log("aqui2");
        socket.on("connect", () => {
            console.log(`you connected with ${socket.id}`);
        });

        socket.on("message", (data) => {
            console.log(data);
        });
    } catch (err) {
        console.log("error: ", err);
    }
}

main();

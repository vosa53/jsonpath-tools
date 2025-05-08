import { describe, expect, it } from "vitest";
import { SimpleRPC, SimpleRPCTopic } from "./simple-rpc";

describe("Simple RPC", () => {
    it("Basic test", async () => {
        // eslint-disable-next-line prefer-const
        let clientRPC: SimpleRPC<TestHandlerClient>;
        const serverRPC = new SimpleRPC<TestHandlerServer>(d => clientRPC.receive(d), t => new TestHandlerServer(t));
        clientRPC = new SimpleRPC(d => serverRPC.receive(d), t => new TestHandlerClient(t));
        serverRPC.registerHandlerAction("ping", (h, d: string) => h.ping(d));

        const clientHandler = clientRPC.createHandler();
        const result = await clientHandler.ping("hello");
        expect(result).toBe("pong");
    });
});

class TestHandlerClient {
    constructor(private readonly topic: SimpleRPCTopic) { }

    ping(greeting: string): Promise<string> {
        return this.topic.sendRequest("ping", greeting);
    }
}

class TestHandlerServer {
    constructor(topic: SimpleRPCTopic) { }

    ping(greeting: string): string {
        if (greeting === "hello")
            return "pong";
        else
            return "bad greeting"
    }
}
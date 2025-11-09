import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import nodeGypBuild from "node-gyp-build";
import { afterAll, beforeAll, describe, expect, it, test } from "vitest";

import grandi from "../../src/index";
import type {
	ReceivedVideoFrame,
	Receiver,
	Sender,
	Source,
} from "../../src/types";

const shouldRunIntegration =
	process.env.RUN_NDI_TESTS === "1" || process.env.RUN_NDI_TESTS === "true";

const addonCanLoad = (() => {
	try {
		nodeGypBuild(path.join(__dirname, "..", ".."));
		return true;
	} catch {
		return false;
	}
})();

const describeIntegration =
	shouldRunIntegration && addonCanLoad ? describe : describe.skip;

async function waitForSourceByName(
	name: string,
	timeoutMs = 15_000,
): Promise<Source> {
	const finder = await grandi.find({ showLocalSources: true });
	const deadline = Date.now() + timeoutMs;
	try {
		while (Date.now() < deadline) {
			finder.wait(250);
			const match = finder
				.sources()
				.find((source) => source.name.includes(name));
			if (match) return match;
			await sleep(100);
		}
		throw new Error(`Timed out discovering sender ${name}`);
	} finally {
		await finder.destroy();
	}
}

async function pumpFrames(
	sender: Sender,
	controller: { running: boolean },
): Promise<void> {
	const width = 64;
	const height = 36;
	const fps = 30;
	const samplesPerFrame = 1600;
	const videoBuffer = Buffer.alloc(width * height * 4, 0xaa);
	const audioBuffer = Buffer.alloc(samplesPerFrame * 2 * 4);
	while (controller.running) {
		await sender.video({
			type: "video",
			xres: width,
			yres: height,
			frameRateN: fps,
			frameRateD: 1,
			pictureAspectRatio: width / height,
			fourCC: grandi.FOURCC_BGRA,
			frameFormatType: grandi.FrameType.Progressive,
			lineStrideBytes: width * 4,
			data: videoBuffer,
		});
		await sender.audio({
			type: "audio",
			sampleRate: 48_000,
			noChannels: 2,
			noSamples: samplesPerFrame,
			channelStrideBytes: samplesPerFrame * 4,
			data: audioBuffer,
			fourCC: grandi.FOURCC_FLTp,
		});
		await sleep(1000 / fps);
	}
}

function assertReceivedVideoFrame(frame: ReceivedVideoFrame) {
	expect(frame.type).toBe("video");
	expect(typeof frame.xres).toBe("number");
	expect(typeof frame.yres).toBe("number");
	expect(typeof frame.frameRateN).toBe("number");
	expect(typeof frame.frameRateD).toBe("number");
	expect(Buffer.isBuffer(frame.data)).toBe(true);
	expect(Array.isArray(frame.timecode)).toBe(true);
	expect(Array.isArray(frame.timestamp)).toBe(true);
	expect(frame.timecode.length).toBe(2);
	expect(frame.timestamp.length).toBe(2);
}

describeIntegration("grandi native addon (integration)", () => {
	beforeAll(() => {
		grandi.initialize();
	});

	afterAll(() => {
		grandi.destroy();
	});

	it("reports version info and CPU support", () => {
		const versionString = grandi.version();
		expect(typeof versionString).toBe("string");
		expect(versionString.startsWith("NDI SDK")).toBe(true);
		expect(/\d+\.\d+\.\d+\.\d+$/.test(versionString)).toBe(true);
		expect(typeof grandi.isSupportedCPU()).toBe("boolean");
	});

	it("creates and disposes finders", async () => {
		const finder = await grandi.find({ showLocalSources: true });
		expect(Array.isArray(finder.sources())).toBe(true);
		await finder.destroy();
	});

	test("can send frames that are received locally", async () => {
		const senderName = `grandi-vitest-${Date.now()}`;
		const sender = await grandi.send({
			name: senderName,
			clockVideo: true,
			clockAudio: true,
		});
		const controller = { running: true };
		const pumpTask = pumpFrames(sender, controller);
		let receiver: Receiver | undefined;

		try {
			const source = await waitForSourceByName(senderName);
			receiver = await grandi.receive({
				source,
				name: `${senderName}-receiver`,
				colorFormat: grandi.ColorFormat.BGRX_BGRA,
			});
			const frame = await receiver.video(5000);
			assertReceivedVideoFrame(frame);
			expect(frame.xres).toBe(64);
			expect(frame.yres).toBe(36);
			const connections = await sender.connections();
			expect(connections).toBeGreaterThanOrEqual(1);
		} finally {
			controller.running = false;
			await pumpTask;
			await sender.destroy();
		}
	}, 60_000);

	test("can route a source to an output", async () => {
		const senderName = `grandi-route-${Date.now()}`;
		const routingName = `${senderName}-routing`;
		const sender = await grandi.send({
			name: senderName,
			clockVideo: true,
			clockAudio: true,
		});
		const controller = { running: true };
		const pumpTask = pumpFrames(sender, controller);
		let routing: Awaited<ReturnType<typeof grandi.routing>> | undefined;
		let routedReceiver: Receiver | undefined;

		try {
			const source = await waitForSourceByName(senderName);
			routing = await grandi.routing({ name: routingName });
			expect(routing.change(source)).toBe(true);
			expect(routing.sourcename()).toContain(routingName);

			const routedSource = await waitForSourceByName(routingName);
			routedReceiver = await grandi.receive({
				source: routedSource,
				name: `${routingName}-receiver`,
				colorFormat: grandi.ColorFormat.BGRX_BGRA,
			});

			const routedFrame = await routedReceiver.video(5000);
			assertReceivedVideoFrame(routedFrame);
			expect(routedFrame.xres).toBe(64);
			expect(routedFrame.yres).toBe(36);
			expect(routing.connections()).toBeGreaterThanOrEqual(1);

			expect(routing.clear()).toBe(true);
		} finally {
			controller.running = false;
			await pumpTask;
			await routing?.destroy();
			await sender.destroy();
		}
	}, 60_000);
});

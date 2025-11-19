import { TestRunner } from "@digital-alchemy/core";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LIB_MOCK_ASSISTANT } from "@digital-alchemy/hass/mock-assistant";
import { HOME_AUTOMATION } from "../../app.module.mts";

// Mock notifyMe
const notifyMe = vi.fn();
vi.mock("../utils/notify.mts", () => ({
    notifyMe: (...args) => notifyMe(...args),
}));

describe("AntiFreeze", () => {
    it("should turn on plugs when temperature is below threshold", async () => {
        const runner = TestRunner({ target: HOME_AUTOMATION });
        runner.appendLibrary(LIB_MOCK_ASSISTANT).configure({
            hass: {
                BASE_URL: "http://localhost:8123",
            },
        });

        await runner
            // set up this test to already have state available when run is executed
            .bootLibrariesFirst()

            .setup(({ mock_assistant }) => {
                // use setupState to create an initial set of conditions
                mock_assistant.entity.setupState({
                    "sensor.frontyard_thermometer_temperature": { state: '40' },
                });
            })

            .run(async ({ hass, lifecycle, mock_assistant }) => {
                // watch for service calls to be made
                const spy1 = vi.spyOn(hass.refBy.id("switch.antifreeze_1"), "turn_on");
                const spy2 = vi.spyOn(hass.refBy.id("switch.antifreeze_2"), "turn_on");

                await mock_assistant.socket.init();
                expect(hass).toBeDefined();
                await lifecycle.onReady(() => {
                    console.log('antifreeze');
                })
                // lifecycle.onReady(async () => {
                // emit state change
                await mock_assistant.entity.emitChange('sensor.frontyard_thermometer_temperature', {
                    state: "35"
                });

                expect(spy1).toHaveBeenCalled();
                expect(spy2).toHaveBeenCalled();
                expect(notifyMe).toHaveBeenCalledWith(
                    expect.anything(),
                    "Anti-freeze Plugs",
                    expect.stringContaining("Turning on plugs")
                );
                // });
            });
    });

    // it("should turn off plugs when temperature is above threshold", async () => {
    //     mockThermometer.state = 40; // Above 37
    //     mockPlug1.state = "on";
    //     mockPlug2.state = "on";

    //     await runner.run(() => { });

    //     expect(mockPlug1.turn_off).toHaveBeenCalled();
    //     expect(mockPlug2.turn_off).toHaveBeenCalled();
    //     expect(notifyMe).toHaveBeenCalledWith(
    //         expect.anything(),
    //         "Anti-freeze Plugs",
    //         expect.stringContaining("Turning off plugs")
    //     );
    // });

    // it("should not do anything if plugs are already in desired state", async () => {
    //     mockThermometer.state = 30;
    //     mockPlug1.state = "on";
    //     mockPlug2.state = "on";

    //     await runner.run(() => { });

    //     expect(mockPlug1.turn_on).not.toHaveBeenCalled();
    //     expect(mockPlug2.turn_on).not.toHaveBeenCalled();
    // });

    // it("should handle unit mismatch", async () => {
    //     mockThermometer.attributes.unit_of_measurement = "°C";

    //     await runner.run(() => { });

    //     // Should default to turning on plugs if unit is wrong (safety)
    //     expect(mockPlug1.turn_on).toHaveBeenCalled();
    // });

    // it("should handle application restart (unknown old state)", async () => {
    //     await runner.run(() => { });

    //     const updateHandler = mockThermometer.onUpdate.mock.calls[0][0];

    //     // Simulate restart: oldState is unknown, newState is valid
    //     mockThermometer.state = 30;
    //     updateHandler(
    //         { state: 30, attributes: { unit_of_measurement: "°F" } },
    //         { state: "unknown", attributes: {} }
    //     );

    //     expect(mockPlug1.turn_on).toHaveBeenCalled();
    // });
});

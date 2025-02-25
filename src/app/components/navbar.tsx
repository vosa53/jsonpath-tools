import { Accordion, Divider, Flex, Stack, Switch, Text } from "@mantine/core";
import { IconHelp, IconMathFunction, IconSettings } from "@tabler/icons-react";
import { memo } from "react";
import { CustomFunction } from "../models/custom-function";
import CustomFunctionsView from "./custom-functions-view";
import { Settings } from "../models/settings";
import SettingsEditor from "./settings-editor";

const Navbar = memo(({
    customFunctions,
    settings,
    onCustomFunctionsChanged,
    onSettingsChanged
}: {
    customFunctions: readonly CustomFunction[],
    settings: Settings,
    onCustomFunctionsChanged: (customFunctions: readonly CustomFunction[]) => void,
    onSettingsChanged: (settings: Settings) => void
}) => {
    return (
        <Flex direction="column" h="100%">
            <Accordion>
                <Accordion.Item value="reference">
                    <Accordion.Control icon={<IconHelp size={20} />}>
                        Language Reference
                    </Accordion.Control>
                    <Accordion.Panel>
                        JSONPath defines a string syntax for selecting and extracting JSON
                        (RFC 8259) values from within a given JSON value.
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="print">
                    <Accordion.Control icon={<IconMathFunction size={20} />}>
                        Custom Functions
                    </Accordion.Control>
                    <Accordion.Panel>
                        <CustomFunctionsView customFunctions={customFunctions} onCustomFunctionsChanged={onCustomFunctionsChanged} />
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="settings">
                    <Accordion.Control icon={<IconSettings size={20} />}>
                        Settings
                    </Accordion.Control>
                    <Accordion.Panel>
                        <SettingsEditor settings={settings} onSettingsChanged={onSettingsChanged} />
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
            <Divider mt="auto" />
            <Text p="xs" c="dimmed">Do you like this application?</Text>
        </Flex>
    );
});
export default Navbar;

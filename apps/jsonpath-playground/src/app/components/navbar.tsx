import { Accordion, Anchor, Divider, Flex, Text } from "@mantine/core";
import { IconHelp, IconMathFunction, IconSettings } from "@tabler/icons-react";
import { memo } from "react";
import { CustomFunction } from "../models/custom-function";
import { Settings } from "../models/settings";
import CustomFunctionsView from "./custom-functions-view";
import SettingsEditor from "./settings-editor";
import { MarkdownView } from "./markdown-view";
import jsonPathGuide from "./jsonpath-guide.md?raw"

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
                        JSONPath Guide
                    </Accordion.Control>
                    <Accordion.Panel style={{ overflow: "auto", maxHeight: "600px" }}>
                        <MarkdownView markdown={jsonPathGuide} withSpacing />
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
            <Text p="xs" c="dimmed">The editor component and parser are also available as standalone <Anchor href="https://vosa53.github.io/jsonpath-tools" target="_blank">libraries</Anchor>.</Text>
        </Flex>
    );
});
export default Navbar;

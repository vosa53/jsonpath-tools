import { ActionIcon, Burger, Flex, Group, Indicator, Title, Tooltip, useMantineColorScheme } from "@mantine/core";
import { IconBrandGithub, IconMoon, IconRoute, IconSun } from "@tabler/icons-react";
import { memo } from "react";

/**
 * Application logo, title and links.
 */
const Header = memo(({
    navbarOpened,
    onNavbarOpenedChanged
}: {
    navbarOpened: boolean,
    onNavbarOpenedChanged: (opened: boolean) => void
}) => {
    const colorScheme = useMantineColorScheme();

    return (
        <Flex justify="space-between">
            <Group p="xs" c="violet.4" gap={0} wrap="nowrap">
                <Burger
                    opened={navbarOpened}
                    onClick={() => onNavbarOpenedChanged(!navbarOpened)}
                    hiddenFrom="md"
                    size="sm"
                    color="violet.4" />
                <IconRoute size={33} stroke={2} />
                <Indicator color="violet" label="RFC 9535" size={16}>
                    <Title order={1} pl="xs" fw="600" visibleFrom="xs" size="24">JSONPath Playground</Title>
                    <Title order={1} pl="xs" fw="600" hiddenFrom="xs" style={{ fontSize: "calc(100vw / 20)", margin: "2px 0 0 0" }}>JSONPath Playground</Title>
                </Indicator>
            </Group>
            <Group pr="xs">
                <Tooltip label="GitHub Repository">
                    <ActionIcon variant="subtle" color="violet" size="lg" aria-label="GitHub Repository" visibleFrom="xs" component="a" href="https://github.com/vosa53/jsonpath-tools" target="_blank">
                        <IconBrandGithub style={{ width: "70%", height: "70%" }} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label="Set Dark Color Scheme">
                    <ActionIcon variant="subtle" color="violet" size="lg" aria-label="Set Dark Color Scheme" darkHidden onClick={() => colorScheme.setColorScheme("dark")}>
                        <IconMoon style={{ width: "70%", height: "70%" }} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label="Set Light Color Scheme">
                    <ActionIcon variant="subtle" color="violet" size="lg" aria-label="Set Light Color Scheme" lightHidden onClick={() => colorScheme.setColorScheme("light")}>
                        <IconSun style={{ width: "70%", height: "70%" }} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
            </Group>
        </Flex>
    );
});
export default Header;

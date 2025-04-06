import { Stack, Switch } from "@mantine/core";
import { Settings } from "../models/settings";

/**
 * Editor for the application settings.
 */
export default function SettingsEditor({
    settings,
    onSettingsChanged
}: {
    settings: Settings,
    onSettingsChanged: (settings: Settings) => void
}) {
    return (
        <Stack>
            <Switch
                defaultChecked
                label="Auto Run"
                onChange={e => onSettingsChanged({ ...settings, autoRun: e.currentTarget.checked })}
            />
            <Switch
                defaultChecked
                label="Auto Save (TODO)"
                onChange={e => onSettingsChanged({ ...settings, autoSave: e.currentTarget.checked })}
            />
        </Stack>
    );
}
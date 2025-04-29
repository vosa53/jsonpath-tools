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
                label="Auto Run"
                checked={settings.autoRun}
                onChange={e => onSettingsChanged({ ...settings, autoRun: e.currentTarget.checked })}
            />
            <Switch
                label="Auto Save"
                checked={settings.autoSave}
                onChange={e => onSettingsChanged({ ...settings, autoSave: e.currentTarget.checked })}
            />
        </Stack>
    );
}
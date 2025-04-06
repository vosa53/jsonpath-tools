/**
 * Application settings.
 */
export interface Settings {
    /**
     * Whether the JSONPath query should be executed automatically after some delay.
     */
    readonly autoRun: boolean;

    /**
     * Whether the application state should be automatically saved.
     */
    readonly autoSave: boolean;
}
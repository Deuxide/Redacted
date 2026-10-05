import { LanguageProvider } from './i18n/LanguageProvider';
import { ThemeProvider } from './theme/ThemeProvider';
import { DiscussionScreen } from './screens/DiscussionScreen';
import { ExportScreen } from './screens/ExportScreen';
import { HomeScreen, SettingsScreen } from './screens/HomeScreen';
import { ImportScreen } from './screens/ImportScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { RevealScreen } from './screens/RevealScreen';
import { SetupScreen } from './screens/SetupScreen';
import { VotingScreen } from './screens/VotingScreen';
import { WordSetEditorScreen } from './screens/WordSetEditorScreen';
import { WordSetsScreen } from './screens/WordSetScreen';
import { GameProvider, useGame } from './state/GameProvider';

function AppRouter() {
  const { screen } = useGame();

  switch (screen) {
    case 'setup':
      return <SetupScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'word-sets':
      return <WordSetsScreen />;
    case 'editor':
      return <WordSetEditorScreen />;
    case 'import':
      return <ImportScreen />;
    case 'export':
      return <ExportScreen />;
    case 'reveal':
      return <RevealScreen />;
    case 'discussion':
      return <DiscussionScreen />;
    case 'voting':
      return <VotingScreen />;
    case 'results':
      return <ResultsScreen />;
    default:
      return <HomeScreen />;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <GameProvider>
          <AppRouter />
        </GameProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

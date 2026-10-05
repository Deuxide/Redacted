import { DiscussionScreen } from './screens/DiscussionScreen';
import { ExportScreen } from './screens/ExportScreen';
import { ImportScreen } from './screens/ImportScreen';
import { HomeScreen } from './screens/HomeScreen';
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
    <GameProvider>
      <AppRouter />
    </GameProvider>
  );
}

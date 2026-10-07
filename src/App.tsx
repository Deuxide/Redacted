import { FullscreenButton } from './components/FullscreenButton';
import { LanguageProvider } from './i18n/LanguageProvider';
import { ThemeProvider } from './theme/ThemeProvider';
import { DiscussionScreen } from './screens/DiscussionScreen';
import { EliminationScreen } from './screens/EliminationScreen';
import { ExportScreen } from './screens/ExportScreen';
import { GuessScreen } from './screens/GuessScreen';
import { HomeScreen, SettingsScreen } from './screens/HomeScreen';
import { QuestionAnswerScreen, QuestionDiscussionScreen, QuestionResultsScreen, QuestionSetupScreen, QuestionVoteScreen } from './screens/QuestionScreens';
import { QuestionImportScreen, QuestionSetEditorScreen, QuestionSetsScreen } from './screens/QuestionSetScreens';
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
    case 'elimination':
      return <EliminationScreen />;
    case 'guess':
      return <GuessScreen />;
    case 'results':
      return <ResultsScreen />;
    case 'question-import':
      return <QuestionImportScreen />;
    case 'question-sets':
      return <QuestionSetsScreen />;
    case 'question-editor':
      return <QuestionSetEditorScreen />;
    case 'question-setup':
      return <QuestionSetupScreen />;
    case 'question-answer':
      return <QuestionAnswerScreen />;
    case 'question-discussion':
      return <QuestionDiscussionScreen />;
    case 'question-vote':
      return <QuestionVoteScreen />;
    case 'question-results':
      return <QuestionResultsScreen />;
    default:
      return <HomeScreen />;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <GameProvider>
          <FullscreenButton />
          <AppRouter />
        </GameProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

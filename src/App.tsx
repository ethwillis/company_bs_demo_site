import { useCallback, useEffect, useMemo, useState } from 'react';

type BId = 'B1' | 'B2' | 'B3' | 'B4';

type BItem = {
  id: BId;
  title: string;
  plain: string;
};

type Question = {
  q: string;
  a: BId;
  choices: BId[];
};

type PlayerStats = {
  points: number;
  streak: number;
  lastPlayed: number;
};

type PlayersState = Record<string, PlayerStats>;

const BS: BItem[] = [
  {
    id: 'B1',
    title: 'Velocity',
    plain: 'Move AI, Security, and Customer Education leads from qualified to customer faster.'
  },
  {
    id: 'B2',
    title: 'Volume',
    plain: 'Increase qualified leads, private portals, and digital license purchases.'
  },
  {
    id: 'B3',
    title: 'Value',
    plain: 'Improve conversion and monthly platform usage while reducing time to go live.'
  },
  {
    id: 'B4',
    title: 'Leverage AI to Lead the Way',
    plain: 'Strengthen AI market leadership, expand AI product pillars, and increase internal AI adoption.'
  }
];

// quiz question bank - one is chosen at random each round.
const QUESTIONS: Question[] = [
  {
    q: 'Which B focuses on moving qualified leads to customers faster?',
    a: 'B1',
    choices: ['B1', 'B2', 'B3', 'B4']
  },
  {
    q: 'Which B includes increasing qualified leads across AI, Security, and Customer Education?',
    a: 'B2',
    choices: ['B1', 'B2', 'B3', 'B4']
  },
  {
    q: 'Which B is about improving conversion efficiency and reducing time to go live?',
    a: 'B3',
    choices: ['B1', 'B2', 'B3', 'B4']
  },
  {
    q: 'Which B is centered on AI leadership and internal AI adoption?',
    a: 'B4',
    choices: ['B1', 'B2', 'B3', 'B4']
  },
  {
    q: 'Speeding up Security deals belongs to which B?',
    a: 'B1',
    choices: ['B1', 'B2', 'B3', 'B4']
  },
  {
    q: 'Increasing SVC/SIC/private portal launches belongs to which B?',
    a: 'B2',
    choices: ['B1', 'B2', 'B3', 'B4']
  },
  {
    q: 'Increasing monthly platform users belongs to which B?',
    a: 'B3',
    choices: ['B1', 'B2', 'B3', 'B4']
  },
  {
    q: 'Expanding the number of AI product pillars launched belongs to which B?',
    a: 'B4',
    choices: ['B1', 'B2', 'B3', 'B4']
  }
];

const DEMO_PLAYERS = ['Ethan (demo)', 'Will (demo)', 'Laura (demo)', 'Brian (demo)', 'Chandler (demo)'];
const STORAGE_KEY = 'bs_demo_state_v3';
const STARTING_POINTS = 0;
const STARTING_STREAK = 0;
const BASELINE_VERSION = 'equal_start_v1';
const BASELINE_KEY = 'bs_demo_baseline_version';
const AUTO_POPUP_ENABLED = false; // set this to true to enable random popups every ~1-2 minutes for a more dynamic demo (can be a bit much, so off by default)

function fmtDate(timestamp: number): string {
  if (!timestamp) {
    return '-';
  }

  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function buildSeedPlayers(): PlayersState {
  const seed: PlayersState = {};

  DEMO_PLAYERS.forEach((name) => {
    seed[name] = {
      points: STARTING_POINTS,
      streak: STARTING_STREAK,
      lastPlayed: 0
    };
  });

  return seed;
}

function loadPlayers(): PlayersState {
  // one-time baseline reset so older saved demo scores do not carry forward. (may get rid of this or add reset function dont know)
  if (localStorage.getItem(BASELINE_KEY) !== BASELINE_VERSION) {
    localStorage.setItem(BASELINE_KEY, BASELINE_VERSION);
    localStorage.removeItem('bs_demo_state');
    localStorage.removeItem('bs_demo_state_v2');
    localStorage.removeItem(STORAGE_KEY);
    return buildSeedPlayers();
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return buildSeedPlayers();
  }

  try {
    const parsed = JSON.parse(raw) as { players?: PlayersState };
    if (parsed.players && Object.keys(parsed.players).length > 0) {
      return parsed.players;
    }
  } catch {
    return buildSeedPlayers();
  }

  return buildSeedPlayers();
}

type ResultState = {
  correct: boolean;
  correctId: BId;
};

export default function App() {
  const [players, setPlayers] = useState<PlayersState>(() => loadPlayers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>(DEMO_PLAYERS[0]);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [shuffledChoices, setShuffledChoices] = useState<BId[]>([]);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);

  // leaderboard ordered by score, then streak.
  const sortedLeaderboard = useMemo(() => {
    return Object.entries(players)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.points - a.points || b.streak - a.streak);
  }, [players]);

  // persist current scoreboard state across refreshes.
  useEffect(() => {
    const payload = { players };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [players]);

  useEffect(() => {
    if (!(selectedPlayer in players)) {
      setSelectedPlayer(Object.keys(players)[0] ?? DEMO_PLAYERS[0]);
    }
  }, [players, selectedPlayer]);

  // optional scheduler for automatic pop quizzes.
  const scheduleNextPopup = useCallback((afterAction: boolean) => {
    if (!AUTO_POPUP_ENABLED) {
      return;
    }
    const seconds = afterAction ? 45 + Math.floor(Math.random() * 76) : 60;
    window.setTimeout(() => {
      openModal();
      scheduleNextPopup(false);
    }, seconds * 1000);
  }, []);

  const openModal = useCallback(() => {
    const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    const choices = [...question.choices]
      .map((choice) => ({ choice, rank: Math.random() }))
      .sort((a, b) => a.rank - b.rank)
      .map((item) => item.choice);

    setCurrentQ(question);
    setShuffledChoices(choices);
    setAnswered(false);
    setResult(null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // correct answer grows streak - any miss resets streak to zero.
  const onAnswer = useCallback(
    (choice: BId | null) => {
      if (!currentQ || answered) {
        return;
      }

      const isCorrect = choice === currentQ.a;
      setAnswered(true);
      setResult({ correct: isCorrect, correctId: currentQ.a });

      setPlayers((prev) => {
        const existing = prev[selectedPlayer];
        if (!existing) {
          return prev;
        }

        return {
          ...prev,
          [selectedPlayer]: {
            points: existing.points + (isCorrect ? 10 : 2),
            streak: isCorrect ? existing.streak + 1 : 0,
            lastPlayed: Date.now()
          }
        };
      });
    },
    [answered, currentQ, selectedPlayer]
  );
  useEffect(() => {
    scheduleNextPopup(false);
  }, [scheduleNextPopup]);

  const answerAndContinue = () => {
    closeModal();
    scheduleNextPopup(true);
  };

  // HTML structure for styling 
  return (
    <>
      <header className="topbar">
        <div className="brand">
          Getting to Know the Company Bs <span className="tag">demo</span>
        </div>
        <div className="actions">
          <button id="openNow" className="btn" onClick={openModal} type="button">
            Pop quiz now
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="card">
          <h2>How it works</h2>
          <ol>
            <li>Click "Pop quiz now" whenever you want to run a round.</li>
            <li>You can answer at your own pace.</li>
            <li>You earn points + keep a streak, and the leaderboard updates.</li>
          </ol>
          <p className="note">
            This is a <strong>static demo</strong> (no real org data). It is meant to show the look/feel for
            a potential Company Bs game.
          </p>

          <h3>Company Bs (for the demo)</h3>
          <div className="bs" id="bsList">
            {BS.map((b) => (
              <div className="bRow" key={b.id}>
                <div className="k">
                  {b.id} - {b.title}
                </div>
                <div className="v">{b.plain}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="split">
            <div>
              <h2>Leaderboard</h2>
              <p className="sub">Points + streak. (Demo names - replace with your team.)</p>
            </div>
          </div>

          <table className="table" id="leaderboard">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Points</th>
                <th>Streak</th>
                <th>Last Played</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeaderboard.map((player, idx) => (
                <tr key={player.name}>
                  <td>{idx + 1}</td>
                  <td>{player.name}</td>
                  <td>{player.points}</td>
                  <td>{player.streak}</td>
                  <td>{fmtDate(player.lastPlayed)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="footerHint">
            Tip: This demo is currently manual-only. Auto popups are disabled.
          </div>
        </section>
      </main>

      <div className="modal" aria-hidden={!isModalOpen}>
        <div className="modal__backdrop" onClick={closeModal} />
        <div className="modal__panel" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
          <div className="modal__header">
            <h2 id="modalTitle">Quick Bs Challenge</h2>
            <button className="iconBtn" onClick={closeModal} aria-label="Close" type="button">
              x
            </button>
          </div>

          <div className="modal__body">
            <div className="row">
              <div className="who">
                <label htmlFor="player">Playing as</label>
                <select
                  id="player"
                  value={selectedPlayer}
                  onChange={(event) => setSelectedPlayer(event.target.value)}
                >
                  {Object.keys(players).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="question" id="question">
              {currentQ?.q ?? 'Loading...'}
            </div>
            <div className="choices" id="choices">
              {shuffledChoices.map((choice) => {
                const title = BS.find((b) => b.id === choice)?.title ?? '';
                return (
                  <button
                    className="choice"
                    key={choice}
                    onClick={() => onAnswer(choice)}
                    disabled={answered}
                    type="button"
                    aria-disabled={answered}
                  >
                    {choice} - {title}
                  </button>
                );
              })}
            </div>

            {result && (
              <div className={`result ${result.correct ? 'ok' : 'bad'}`} id="result">
                {result.correct ? 'Correct!' : 'Not quite.'} Correct answer: <strong>{result.correctId}</strong>{' '}
                - {BS.find((b) => b.id === result.correctId)?.title}
                <br />
                <span className="result__meta">{result.correct ? '+10 points, streak +1' : '+2 points for participating'}</span>
              </div>
            )}
          </div>
          
          <div className="modal__footer">
            <button className="btn btn--ghost" onClick={answerAndContinue} type="button">
              Skip
            </button>
            <button className="btn" onClick={answerAndContinue} disabled={!answered} type="button">
              Next
            </button>
          </div> 
        </div>
      </div>
    </>
  );
}

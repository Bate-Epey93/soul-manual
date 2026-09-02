/* ===== The Seventeen — a research-grounded inquiry plan =====
   Source: "The Seventeen: A Research-Grounded Inquiry Plan" (Sept 2026).
   Structured, not rewritten. The instrument collects Beet's writing; it never
   generates answers. Grades: A multiple RCTs/meta · B ≥1 RCT/controlled ·
   C long use, no trials · S symbolic, prompt-generator only. */

var SEVENTEEN = {
  title: 'The Seventeen',
  sub: 'Not a set of answers. A path for thinking through seventeen questions, with the traditions, research and practices real people have used to think about them — graded by how much evidence stands behind each. The app holds answers. This instrument holds yours.',
  rules: [
    'Two practices live, never three. A third must replace one.',
    'The fourteen-day drop rule. A practice unused for fourteen days is dropped without comment. Not paused. Dropped. It can be re-adopted later as a fresh choice.',
    'One action per session. Not a plan. One if-then sentence.',
    'Write, do not think. Every prompt is answered on paper or screen. Thinking in the head is the escape hatch with better lighting.',
    'The routing rule. If a session produces material heavier than the container — flashbacks, sustained hopelessness, anything that frightens you about yourself — the session ends and Routing applies. Not failure. The practice being honest about its scope.'
  ],
  success: 'At twelve weeks, not seventeen answers. Four things: sixty to eighty pages of written inquiry in your own hand; a ledger showing which weekly actions were kept, with a ratio you can read; two or three practices that survived the drop rule because they were actually used; and a shorter list of questions, because some will have dissolved, some merged, and one or two will have become the real ones.',
  clusters: [
    { id: 'A', name: 'Legs', qs: [1, 4, 15], mech: 'Action, energy, and the loops that steal both', weeks: [1, 3] },
    { id: 'B', name: 'Ground', qs: [6, 7, 9, 13], mech: 'Regulation, the body, peace, and being seen', weeks: [4, 6] },
    { id: 'C', name: 'Self', qs: [5, 8, 10, 12], mech: 'Worth, freedom, security, identity', weeks: [7, 9] },
    { id: 'D', name: 'Depth', qs: [11, 14, 16], mech: 'Attention, needs, wounds', weeks: [10, 12] },
    { id: 'E', name: 'Lineage', qs: [2, 3, 17], mech: 'Masculinity, speech, inheritance — a parallel track, answered in company', weeks: [1, 12], parallel: true }
  ],
  method: [
    { id: 'sigh', name: 'The physiological floor', min: 5, grade: 'A', text: 'Five minutes of cyclic sighing: inhale through the nose, a second short inhale to top up, then a long exhale through the mouth. Balban, Spiegel, Huberman et al., Cell Reports Medicine 2023 — greater mood improvement than an equal period of mindfulness. This is the Return-in-Place with a trial behind it. Do it first, always.', write: false },
    { id: 'terms', name: 'Define the terms', min: 5, grade: 'C', text: 'Before answering, write what you mean by the word doing hidden work in the question — in one sentence — then what you do not mean. Half the questions dissolve partially at this step. Epictetus opens the Enchiridion with a definition for exactly this reason.', write: true },
    { id: 'freewrite', name: 'Free-write', min: 20, grade: 'A', text: 'Twenty minutes, without stopping, without editing, no rereading until it is done. Pennebaker’s expressive-writing protocol, tested in well over a hundred studies since 1986: writing forces a structure onto experience that rumination never provides. Editing is locked. Backspace works inside the word you are on.', write: true, lock: true },
    { id: 'third', name: 'Read it back in the third person', min: 5, grade: 'B', text: 'Reread the free-write as if written by a man named Bate. Kross’s self-distancing research: “he” instead of “I” reduces rumination and reactivity while preserving insight. Write three sentences about what that man seems to believe. The third person has no defendant.', write: true, showPrev: 'freewrite' },
    { id: 'counter', name: 'Find the counter-evidence', min: 5, grade: 'A', text: 'Every belief that surfaced gets one line of counter-evidence, written down. Not to win the argument. A mind trained on the case for the prosecution needs to be made to file for the defense at least once. The core move of cognitive therapy.', write: true },
    { id: 'naikan', name: 'Naikan’s three questions', min: 10, grade: 'B', text: 'About the specific person this question touches: What did I receive from them? What did I give them? What troubles did I cause them? The fourth question — what troubles they caused me — is excluded, because everyone already asks it constantly. The exact counterweight to the case-builder.', write: true, optional: true },
    { id: 'action', name: 'One action, in if-then form', min: 2, grade: 'A', text: 'If [situation], then I [action]. Gollwitzer & Sheeran 2006, 94 studies, medium-to-large effect: the if-then hands the decision to the situation instead of to willpower. Name the trigger, not just the act. “I write for twenty minutes” is a wish. “If it is 6:40 and the coffee is poured, then I open the manuscript before the phone” is an implementation intention. This is the àfọ̀ṣẹ sentence with the trigger clause the research says matters.', write: true, ifthen: true }
  ],
  questions: [
    { id: 1, cluster: 'A', text: 'What if I stopped waiting for perfect, stopped being afraid of starting over, and moved?', person: false,
      reframe: 'Not “why don’t I act” — the mind already has ten answers — but “what mechanism converts an intention into an act without passing through the checkpoint called perfect.” An engineering question disguised as a courage question.',
      lenses: [
        ['Psychology', 'Gollwitzer’s implementation intentions. Oettingen’s mental contrasting (WOOP: Wish, Outcome, Obstacle, Plan) — positive fantasy alone reduces effort; contrasting the wish with the obstacle increases it. Behavioral activation: action precedes motivation, not the reverse.'],
        ['Tradition', 'Morita therapy (Japan, 1920s): arugamama — accept the feeling as it is, then do the next necessary thing anyway. Hayes has acknowledged ACT’s debt to Morita. The Gita’s nishkama karma: action released from its fruit.'],
        ['History', 'The perfectionist start is a modern luxury. Craft traditions trained by apprenticeship: bad pots for years, in public, under a master — that was the curriculum. Beginning only when ready is roughly as old as learning alone from books.'],
        ['Unconventional', 'Lamott’s “shitty first drafts” — the writers’ folk version of behavioral activation. Musashi: no fixed form; the practitioner who stops on a stance is cut there.']
      ],
      evidence: [['Implementation intentions: Gollwitzer & Sheeran 2006 meta-analysis, 94 studies, medium-to-large effect.', 'A'], ['Mental contrasting (WOOP): Oettingen, multiple RCTs; Rethinking Positive Thinking (2014).', 'A'], ['Behavioral activation: non-inferior to CBT for depression (Richards et al., Lancet 2016).', 'A'], ['Morita therapy: RCTs mostly in Japan and China; UK pilot (Sugg et al., BMJ Open 2018).', 'B']],
      prompts: ['Define “perfect” as you actually use it. What would have to be true before you allowed yourself to begin the book, the first invitation, the open mic? List the conditions. Mark each: real prerequisite, or permission slip?', 'Name the last three things you started imperfectly that went fine. Not big things. What was different about those starts?', 'WOOP the book, or whichever thing is waiting: the wish in one line; the best outcome in one line; the single internal obstacle that most reliably stops you; the if-then plan for that obstacle.', 'Naikan on yourself as a maker: what have you received from your unfinished work? What have you given it? What trouble have you caused it by waiting?', 'Reread in third person: what does Bate seem to believe happens if he starts before he is ready? Write it as a sentence. Then the counter-evidence.', 'Close with the if-then sentence for this week.'],
      practices: ['ifthen', 'fivemin', 'arugamama'],
      read: ['Oettingen, Rethinking Positive Thinking (2014)', 'Lamott, Bird by Bird (1994)', 'Reynolds, Constructive Living (1984) — the short American adaptation of Morita'],
      trap: 'Researching how to start. This question generates reading lists faster than any other, and reading is how the overflow refills. The rule for this question: no new book until the current if-then has been kept twice.' },

    { id: 4, cluster: 'A', text: 'How do I build present energy that builds up?', person: false,
      reframe: 'Two separate questions: how is energy deposited, and where is it leaking. Most people only work the first. Your own audit says the leaks are the bigger account.',
      lenses: [
        ['Psychology', 'Self-Determination Theory: vitality rises when autonomy, competence and relatedness are met; daily diaries show vitality tracks need satisfaction day to day. Sleep science: CBT-I and sleep regularity are strong; popular claims often outrun the data. Assertiveness training for the over-giving leak.'],
        ['Tradition', 'Chinese cultivation logic — qi follows attention; energy gathered by daily small deposit — and the Reservoir practice. Yoruba ìtutù: coolness as the condition under which force flows clean; energy spent in heat is wasted.'],
        ['History', 'Before electric light humans slept in two segments with a waking period between (Ekirch, At Day’s Close); the eight-hour block is a nineteenth-century artifact. For a man on four hours: the target is not a mythical eight, it is regularity and enough.'],
        ['Unconventional', 'Nature exposure. White et al. 2019, nearly 20,000 people: 120 minutes a week in natural settings associated with significantly better wellbeing, no further gain past about 300. For a nature-element man this is not a metaphor.']
      ],
      evidence: [['Exercise for mood and energy: comparable to first-line treatment for mild-to-moderate depression.', 'A'], ['CBT-I for sleep: first-line, multiple meta-analyses.', 'A'], ['Nature exposure: White et al. 2019; Bratman et al. 2015 (ninety-minute nature walk reduced rumination).', 'A/B'], ['SDT need satisfaction and vitality: Reis et al. 2000, daily diary.', 'A'], ['Assertiveness training: RCTs since the 1970s; reliable effects on the ability to refuse.', 'A']],
      prompts: ['Define “energy.” Physical? Attentional? Emotional? Which one do you actually mean when you say you are empty?', 'The leak audit: for one week, at day’s end, name the single interaction or activity that cost the most and whether it was chosen or defaulted into. Seven entries. Read them in third person.', 'Write the three SDT needs as questions: where in my week am I autonomous, competent, connected? Which is starving?', 'The sleep honesty line: how many hours, really, and what is the story that makes four acceptable?', 'The generosity gate from the Money Protocol: the one “yes” this week that should have been a “no,” and what it cost.', 'If-then: one deposit (sleep anchor, green walk) or one leak closed (one refusal).'],
      practices: ['sleepanchor', 'greenhour', 'refusal'],
      read: ['Walker, Why We Sleep (2017) — mechanics; several strong claims challenged; motivation, not gospel', 'Williams, The Nature Fix (2017)', 'Pink, Drive (2009) — the concrete SDT popularization'],
      trap: 'Optimizing intake while the leaks run. You will be tempted to build the perfect sleep protocol and keep saying yes to everyone. The leak side is where your energy actually goes.' },

    { id: 15, cluster: 'A', text: 'What are my addictions?', person: false,
      reframe: 'What am I using to escape a feeling I have not named, and what would the feeling be if the escape were closed. Brewer’s definition: a repeated behavior despite adverse consequences, driven by a loop of trigger, behavior, reward.',
      lenses: [
        ['Psychology', 'Brewer’s habit-loop model and RAIN adapted for craving; Marlatt’s urge surfing; Lembke’s dopamine-balance model — why the phone reach feels like relief and produces deficit.'],
        ['Tradition', 'Buddhist taṇhā as the engine of suffering. Somé: every addiction is a displaced ceremony — the cure is restoring the rite, not white-knuckling abstinence. The Anti-Performance Clause already names comprehension itself as one of your escapes.'],
        ['History', 'The attention economy is engineered. The phone reach is a design success more than a personal failing (Harris, Newport). Knowing that does not remove the pull; it removes the shame, which is part of the loop.'],
        ['Unconventional', 'Maté: not why the addiction, but why the pain. Newport’s thirty-day digital declutter as an experiment, not a purity test.']
      ],
      evidence: [['Mindfulness training for smoking cessation (Brewer et al. 2011 RCT); app-based craving programs with RCT support.', 'B'], ['Urge surfing / relapse prevention (Marlatt): decades of controlled research.', 'A'], ['Digital friction (timers, grayscale, notification removal): modest but real reductions.', 'B'], ['Somé’s displaced ceremony: traditional claim.', 'C']],
      prompts: ['List every repeated behavior you do despite not wanting to. Phone, the comprehension loop, irony, over-giving, staying up, checking her status. No judgment; the list.', 'For each: the trigger (what feeling arrives just before), the behavior, the reward (the first thirty seconds). Write the loop out. Seeing it clearly is itself the intervention.', 'For the phone: for three days, before every reach, write one word for what you were feeling. Read the words. That list is the real addiction.', 'Naikan on the phone: what have you received from it? Given? What trouble have you caused — to sleep, to Marie, to the book?', 'Somé’s question: what ceremony is each addiction impersonating? Comprehension impersonates initiation. The phone impersonates contact. Over-giving impersonates belonging. Write the ceremony each stands in for.', 'If-then: one loop, one substitute trigger for the week.'],
      practices: ['urgesurf', 'oneword', 'cutoff'],
      read: ['Brewer, Unwinding Anxiety (2021)', 'Lembke, Dopamine Nation (2021)', 'Newport, Digital Minimalism (2019)', 'Maté, In the Realm of Hungry Ghosts (2008) — first third if time is short'],
      trap: 'Treating comprehension as exempt. The phone is the addiction you will admit to; the loop of reading and framework-building is the one that costs more, and this document can feed it. Apply the one-word log to the urge to open one more source.' },

    { id: 6, cluster: 'B', text: 'What do I do daily to choose my peace, to live it, and protect it?', person: false,
      reframe: 'What is the minimum daily architecture that produces a regulated nervous system, and what defends it. Three verbs, three different tools.',
      lenses: [
        ['Psychology', 'Morning-routine research is thin, but the sequencing effect is real: the first input sets attentional tone. Assertiveness training for “protect.” Mindfulness-based programs for “live.”'],
        ['Tradition', 'The Ignatian examen: five-step evening review used daily for four hundred years. Islamic muhasaba: the daily reckoning, recommended by al-Ghazali. Seneca examining his day each night (On Anger 3.36). Three traditions arrived independently at one instrument: a short structured evening review.'],
        ['History', 'The morning practices in the Grammar of Return sit inside a global pattern: nearly every tradition places its anchor at the first waking minutes, before speech.'],
        ['Unconventional', 'Stoic Week experiments (LeBon et al., annual since 2012) report wellbeing gains from a week of Stoic practices; pre-post and self-selected, so graded low.']
      ],
      evidence: [['Mindfulness-based programs: large meta-analyses, moderate effects on stress and anxiety.', 'A'], ['Assertiveness training.', 'A'], ['Structured evening review (examen, muhasaba, Stoic): centuries of daily use; no trials.', 'C'], ['Sleep regularity as a peace variable.', 'A']],
      prompts: ['Define peace in one sentence. Then write what disturbed it most often in the last seven days. The disturbances are the data; peace is their absence, not a state.', '“Choose”: what is the first input of your day, honestly? Write the last seven mornings.', '“Live”: which hours of the week are you not building a case, not performing, not managing anyone? Name them. Peace already lives there.', '“Protect”: whose access to you is unlimited, and who has earned that? The list.', 'Rosenberg’s rewrite: every “I have to” from this week restated as “I choose to, because.” Which cannot be honestly restated? Examine those.', 'If-then: one morning anchor or one evening review, for the week.'],
      practices: ['morningminute', 'eveningreview', 'refusal'],
      read: ['Pigliucci, How to Be a Stoic (2017)', 'Martin, The Jesuit Guide to (Almost) Everything (2010) — the examen, for non-Catholics', 'Rosenberg, Nonviolent Communication — in the manual'],
      trap: 'Building a routine so complete it becomes the performance. The morning minute is sixty seconds, not a ceremony. Past ten minutes it has become something to be good at.' },

    { id: 7, cluster: 'B', text: 'What is my peace? Where is my peace?', person: false,
      reframe: 'Whether peace is a place, a condition, or an absence — and whether the quiet you sometimes find is peace or withdrawal.',
      lenses: [
        ['Psychology', 'Chödrön’s groundlessness has a clinical cousin in ACT’s acceptance: willingness to have the present experience, not removal of the unwanted. Secure people report a portable felt safety, not a location (Mikulincer & Shaver).'],
        ['Tradition', 'Ìtutù: coolness as climate. Sufi sakīna: tranquility that descends rather than is manufactured. Quaker expectant waiting: the silence after the noise stops, not before.'],
        ['History', 'The eightfold fence: the Japanese inner chamber as sanctuary or prison depending on whether the door opens. Your Aloof drama makes this the central distinction.'],
        ['Unconventional', 'The interruptibility test: real peace survives being interrupted by someone who loves you; the counterfeit needs you unreachable. Not from a study. From the manual, and the most useful single test on the question.']
      ],
      evidence: [['ACT acceptance processes: multiple meta-analyses.', 'A'], ['Attachment security and felt safety.', 'A'], ['Nature exposure and rumination: Bratman et al. 2015.', 'B']],
      prompts: ['Define peace. Then three moments in the last month where you had it. Where, who was there, what was your body doing?', 'Three moments of quiet that were not peace — the fence, the withdrawal, the composed silence. What distinguishes the two sets?', 'The interruptibility test on each: if Marie had called into that moment, would it have held or broken?', 'Write where your peace is not: the conditions you are waiting on — job, debt, ocean. Then one sentence on what you would do if they never resolved.', 'Third-person reread: where does Bate believe his peace lives? Is he right?', 'If-then: one visit to a place on the list, this week.'],
      practices: ['peacemap', 'sigh'],
      read: ['Chödrön, When Things Fall Apart — in the manual', 'Harris, The Happiness Trap (2007) — the concrete ACT book'],
      trap: 'Mistaking the fence for the sanctuary. The Aloof reports withdrawal as peace, and it feels identical from inside. Only the interruptibility test tells them apart.' },

    { id: 9, cluster: 'B', text: 'What is my body unified with at this moment?', person: false,
      reframe: 'Not a question to answer; an instrument. Its function is to drop attention from the head into the body, and its value is entirely in the asking. The research name for what it trains is interoception.',
      lenses: [
        ['Psychology', 'Interoception (Craig; Khalsa; Garfinkel): accuracy in sensing internal states predicts emotional regulation, and it is trainable. Body scan from MBSR. Somatic Experiencing (Levine); van der Kolk.'],
        ['Tradition', 'Ẹ̀mí, the breath, as the only present-tense component of the person. Vipassana body-sweeping. The lower dantian. Yoga as interoceptive training, which is what it was before it became fitness.'],
        ['History', 'Western thought divorced body from mind around Descartes and has been remarrying them since the 1990s. The traditions never divorced them.'],
        ['Unconventional', 'Gendlin’s Focusing: attend to the felt sense of a situation in the body and wait for a word or image to arrive. Developed from research on what made therapy work.']
      ],
      evidence: [['Body scan and MBSR for stress; interoceptive accuracy improves with practice.', 'A/B'], ['Somatic Experiencing: one RCT for PTSD (Brom et al. 2017).', 'B'], ['Trauma-sensitive yoga: RCT (van der Kolk et al. 2014).', 'B'], ['Focusing: several small controlled studies.', 'B']],
      prompts: ['Do not write about this question. Ask it hourly for one day and each time write only the body part that answers first. Jaw, chest, gut, shoulders, feet.', 'At day’s end, read the words. What does the pattern say about where you hold the day?', 'The honest inventory: sleep hours, the ankles and knees, breath rate when working. Written as a mechanic writes a vehicle report.', 'Gendlin’s question, once: “what is the whole feel of my life right now, in the body?” Wait. Do not supply an answer. Write whatever arrives, including nothing.', 'If-then: one body deposit for the week — the rehab you deferred, a walk, a stretch.'],
      practices: ['hourlydrop', 'focusing', 'rehab'],
      read: ['Gendlin, Focusing (1978)', 'Van der Kolk, The Body Keeps the Score (2014) — trauma claims sometimes broader than the evidence', 'Levine, Waking the Tiger (1997)'],
      trap: 'Answering with a concept. “My body is unified with my purpose” is the escape hatch in somatic clothing. The only valid answers are body parts and sensations.' },

    { id: 13, cluster: 'B', text: 'How do I breathe through fear and not feeling seen?', person: true,
      reframe: 'Two questions in one sentence. Fear has a physiological answer. Not being seen has a behavioral one — the harder of the two, because being seen requires the exact exposure the Aloof drama exists to prevent.',
      lenses: [
        ['Psychology', 'Fear: the exposure literature — graded, repeated exposure reduces the fear; the single most robust finding in clinical psychology. Being seen: Brown’s vulnerability research; graded visibility as an exposure hierarchy.'],
        ['Tradition', 'Baldwin’s masks. Lorde: your silence will not protect you. The orí address — speaking aloud to oneself as the first act of being seen by oneself.'],
        ['History', 'Pre-performance rituals reduce anxiety and improve performance even when the performer knows they are arbitrary (Brooks et al. 2016). Every culture of performers has them.'],
        ['Unconventional', 'Improv for social anxiety: Felsman et al. 2019, 2020. Toastmasters: no trials, decades of structured graded exposure to being seen and heard.']
      ],
      evidence: [['Exposure therapy: the strongest evidence base in the field.', 'A'], ['Cyclic sighing for acute fear.', 'A'], ['Pre-performance rituals: Brooks et al. 2016.', 'B'], ['Improv for social anxiety: Felsman et al.', 'B'], ['Brown’s vulnerability research: qualitative.', 'C']],
      prompts: ['Separate the two. “Fear”: list what you fear this month. “Unseen”: list where you feel unseen. Different lists, different tools.', 'For fear: for each item, what would happen if it came true, then what you would do the next day. Seneca’s premeditatio; decatastrophizing in CBT.', 'For unseen: where have you chosen not to be visible? The composed summary, the polished ask, the feeling processed offstage. Then: who has seen you unpolished in the last month? If nobody, the loop is closed at your end.', 'Build the exposure ladder for being seen: ten rungs from easiest (one unedited voice note to Marie) to hardest (the open mic). Order them.', 'Naikan on the people who have tried to see you: what have they received when you let them? What did you give? What trouble did the mask cause them?', 'If-then: rung one of the ladder, this week.'],
      practices: ['ladder', 'preritual', 'improv'],
      read: ['Brown, Daring Greatly (2012)', 'Ferriss, fear-setting (TED 2017); Seneca, Letters 13 and 24'],
      trap: 'Treating “not seen” as something done to you. The loop closes at your end: the mask goes on, then the ache arrives as if from outside. No amount of breathing fixes a loop you hold both ends of. Only the ladder does.' },

    { id: 5, cluster: 'C', text: 'Am I enough?', person: false,
      reframe: 'Enough for what, measured by whom. Unanswerable as posed because it names neither. The useful version is “am I congruent,” and the useful practice is self-compassion — more trial evidence than almost anything else here.',
      lenses: [
        ['Psychology', 'Neff’s self-compassion: self-kindness, common humanity, mindfulness — measurable and trainable. Mindful Self-Compassion has RCT support; Ferrari et al. 2019 meta-analysis, 27 RCTs, moderate effects. Kross’s self-distancing for the internal tribunal.'],
        ['Tradition', 'Mussar’s anavah: occupying no more than your place and no less than your space. “Am I enough” is a humility disorder in that sense — it assigns you less than your space. Muhasaba runs the review without the verdict. The Yoruba answer: you chose this orí; enoughness was settled before the crossing.'],
        ['History', 'The internalized gaze. Fanon on how a colonial standard installs itself as the inner judge; hooks on boys learning worth as function. The question has a genealogy, and it is not personal.'],
        ['Unconventional', 'Goggins’ cookie jar: a written file of evidence of past capacity, consulted when the tribunal convenes. A practitioner’s version of the CBT positive data log, which has trial support for low self-esteem.']
      ],
      evidence: [['Self-compassion interventions: Ferrari et al. 2019, 27 RCTs.', 'A'], ['Self-distancing: Kross.', 'B'], ['Positive data log (Fennell’s low self-esteem CBT).', 'A/B'], ['Mussar: centuries of practice.', 'C']],
      prompts: ['Complete the sentence, honestly: “I would be enough if ______.” Ten times. For each, write who set that standard. Name them.', 'The last three times the question fired. What was happening thirty seconds before? The trigger is more informative than the question.', 'Neff’s exercise: write what you would say to a man you respect who came to you with this exact question. Read it addressed to yourself, in the third person.', 'The congruence swap: replace “am I enough” with “is what I said this week what I did this week.” Answer that instead. It has an answer.', 'Mussar’s frame: where this month did you take less than your space? More than your place? Both are the same disorder.', 'If-then: one entry in the evidence file this week, in the oríkì format — the name, and the moment that earned it.'],
      practices: ['selfcompassion', 'evidencefile', 'rename'],
      read: ['Neff, Self-Compassion (2011)', 'Morinis, Everyday Holiness (2007)', 'Kross, Chatter (2021)'],
      trap: 'Answering it. Every answer, including yes, keeps the tribunal in session. Notice the question has fired and go keep a word.' },

    { id: 8, cluster: 'C', text: 'How do I feel free in myself?', person: false,
      reframe: 'Free from what, and free for what. The first half has a psychological answer (the audience). The second has a values answer (what you would do with it).',
      lenses: [
        ['Psychology', 'ACT’s psychological flexibility: acting on values in the presence of difficult internal experience, not in its absence. Values clarification as the “free for.” Behavioral experiments for testing whether the imagined audience reacts as feared.'],
        ['Tradition', 'Frankl’s last freedom. Fanon’s disalienation: refusing the frame, not rebelling within it. The Stoic dichotomy of control. Acting from the inner head rather than the fortified position is what freedom looks like from inside.'],
        ['History', 'Black freedom thought (Baldwin, Fanon, Diop) is in the manual; the through-line is that freedom is the refusal of an installed standard, and the installation is historical, not personal.'],
        ['Unconventional', 'Stanislavski’s public solitude: the capacity to be private in public — the exact skill the Aloof man lacks.']
      ],
      evidence: [['ACT: meta-analyses across conditions.', 'A'], ['Values clarification: RCTs within ACT; values card sort widely used.', 'A/B'], ['Behavioral experiments: core CBT method.', 'A']],
      prompts: ['Define free. Then what you are not free from, this month, concretely.', 'The audience inventory: whose approval are you unconsciously working for? Parents, the imagined gatekeeper, the Bakwa reader, the man who left Douala, Marie. Which of those juries has actually adjourned?', 'Values sort: from your eight North Star lines, the three that matter most. One action this month that served each. One that betrayed each.', 'The behavioral experiment: one thing you would do if no one were watching. Predict the reaction. Do it. Record the actual. Freedom is usually the gap.', 'Fanon’s question: which standard are you measuring yourself against, and who set it? One sentence. Then whether you would choose it.', 'If-then: the experiment, this week.'],
      practices: ['valuessort', 'withoutnod', 'publicsolitude'],
      read: ['Frankl, Man’s Search for Meaning — in the manual', 'Harris, The Happiness Trap', 'Fanon via the manual’s rendering'],
      trap: 'Rebellion. Doing the opposite of what the audience wants is still performing for the audience. Freedom is indifference to the verdict, not inversion of it.' },

    { id: 10, cluster: 'C', text: 'What does it mean to be secure?', person: false,
      reframe: 'Which security: financial (arithmetic), or internal (the felt sense of being permitted to exist). Different materials, and the belief that the first delivers the second is the trap.',
      lenses: [
        ['Psychology', 'Attachment security as a portable felt safety, and the finding that it can be primed — temporarily increased by recalling being safely held. Thaler & Benartzi’s Save More Tomorrow for the arithmetic.'],
        ['Tradition', 'Diop’s restored self-knowledge as the security no institution can revoke. Ubuntu: security as embeddedness, not fortification. Orí as the security settled before birth.'],
        ['History', 'The breadwinner script makes provision the whole of male worth, which is why financial insecurity lands on men as existential insecurity.'],
        ['Unconventional', 'Housel: security as the gap between what you have and what you need, with “need” the variable most never examine. The Tao’s enough line with charts.']
      ],
      evidence: [['Attachment security priming: multiple lab studies.', 'B'], ['Automated saving: field studies.', 'A'], ['Emergency fund and financial stress: large survey literature; causal evidence modest.', 'B']],
      prompts: ['Define secure. Twice: the money version and the felt version.', 'The money version is in the Money Protocol. Which number are you actually working toward this month, and did the generosity gate hold?', 'The felt version: three times in your life you felt completely safe with another person. Where, who, what was happening. Recalling these increases felt security for hours.', 'The trap test: imagine the floor achieved. Debt zero, savings held. What does the tribunal say then? If the same thing, the money was never the variable.', 'Ubuntu’s question: who holds you? The names. If the list is one name nine thousand kilometers away, that is the security gap, and it is not financial.', 'If-then: one automation (money) or one holding (a call to one of the names), this week.'],
      practices: ['automation', 'securityprime', 'holdingcall'],
      read: ['Housel, The Psychology of Money (2020)', 'Levine & Heller, Attached — in the manual', 'Sethi, I Will Teach You to Be Rich (2019) — automation mechanics; ignore the title'],
      trap: 'Working only the arithmetic. The felt security is the one you lack, and it is built by being held, not by being solvent.' },

    { id: 12, cluster: 'C', text: 'Who exactly am I?', person: false,
      reframe: 'Whether identity is a thing to discover, a story to author, or a record to keep. The research favors the second and your own grammar the third; they are compatible.',
      lenses: [
        ['Psychology', 'McAdams’s narrative identity: the internalized evolving life story, with decades of studies linking story features to wellbeing. Rogers on congruence. Miller’s Drama of the Gifted Child: the child who learns to perform for approval and loses access to what he feels — the clinical description of the shamed dreamer.'],
        ['Tradition', 'Orí: identity as recollection of a chosen destiny. Ubuntu: constituted by relationship. Akan okra and sunsum, the latter shaped by conduct. Mussar: character is the curriculum.'],
        ['History', 'The oríkì tradition: identity as accumulated praise-names earned by deed. Narrative identity with a thousand-year track record.'],
        ['Unconventional', 'Numerology and Human Design [S] — see the symbolic lenses. Goffman’s Presentation of Self: the performed self named from the outside.']
      ],
      evidence: [['Narrative identity and wellbeing: McAdams, large literature.', 'A'], ['Congruence (Rogers): supported indirectly by outcome research.', 'B'], ['Miller’s gifted child: clinical, no trials.', 'C']],
      prompts: ['Do not write a definition. McAdams’s Life Story Interview, abbreviated: your life as a book with chapters. Name them. Then the high point, the low point, the turning point, each as a scene.', 'Where in that story were you performing and where not? Miller’s question: when did you learn that being yourself was less safe than being useful?', 'The typology audit: every label you have adopted (Manifestor, 3/5, nature element, dreamer, translator). For each: does it currently lead you to a need, or end the inquiry?', 'The ledger answer: three things you kept this month that cost you something. A truer answer than any label.', 'Ubuntu: who you are to the five people who know you best, one line each. Then who you are to yourself. Compare.', 'If-then: one oríkì entry, earned, this week.'],
      practices: ['lifestory', 'evidencefile', 'labelcheck'],
      read: ['McAdams, The Stories We Live By (1993)', 'Miller, The Drama of the Gifted Child (1979)', 'Goffman, The Presentation of Self in Everyday Life (1956)', 'Rogers, On Becoming a Person (1961)'],
      trap: 'The typology cage. A man with your vocabulary can build a very sophisticated prison out of accurate labels. The test is always whether a label leads to a need or ends the inquiry.' },

    { id: 11, cluster: 'D', text: 'What is the quality of my consciousness?', person: false,
      reframe: 'Where am I operating from, and how quickly do I notice when I have left. The research name is decentering, or meta-awareness; your own name is the interval.',
      lenses: [
        ['Psychology', 'Decentering — observing thoughts as events rather than facts — is the proposed mechanism of MBCT and predicts relapse prevention. Watkins’s rumination research: abstract processing (“why am I like this”) versus concrete (“what specifically happened”).'],
        ['Tradition', 'Zukav’s question in its original form. Vipassana noting. Sufi muraqaba, watchfulness. The Grammar of Return’s departure-and-noticing metric.'],
        ['History', 'Every contemplative tradition has an equivalent of the interval, and none measures it by depth of experience. They measure it by speed of return.'],
        ['Unconventional', 'The Play Log, adapted: one line a day recording the longest departure and what brought you back.']
      ],
      evidence: [['MBCT and decentering: RCTs for relapse prevention.', 'A'], ['Rumination-focused CBT (Watkins): RCTs.', 'A/B'], ['Noting practice within mindfulness programs.', 'A'], ['Affect labeling: Lieberman et al. 2007.', 'B']],
      prompts: ['Define quality. Not depth. The three places the manual says it is measurable: the interval, the origin of speech, whether the wave completes before naming.', 'For one week, log the longest departure each day and what brought you back. Read the seven. What is the average return trigger?', 'Watkins’s test on one recent painful thought: abstract (“why do I always”) or concrete (“at 15:52 I sent a message that”)? Rewrite the abstract one as concrete.', 'Speech origin: three sentences you said this week, each marked inner head or fortified position. How did each feel in the body afterward?', 'The wave: one feeling this week you named before it finished. What did the naming cost?', 'If-then: the departure log, daily, for a week.'],
      practices: ['departurelog', 'noting', 'concreterewrite'],
      read: ['Williams & Penman, Mindfulness: Finding Peace in a Frantic World (2011)', 'Watkins via the manual’s rendering; his clinical book is technical'],
      trap: 'Grading depth. The Anti-Performance Clause forbids it. Quality is speed of return, and nothing else is watched.' },

    { id: 14, cluster: 'D', text: 'What need is my energy serving?', person: true,
      reframe: 'What am I actually trying to get when I do what I do, and is the strategy serving the need or impersonating it.',
      lenses: [
        ['Psychology', 'SDT’s three needs as the tested version of Rosenberg’s list; daily need satisfaction predicts daily wellbeing. NVC as the practice layer: feeling, need, request.'],
        ['Tradition', 'The caretaker as “tending other people’s orí while one’s own goes unfed.” Mussar’s trait inventory as a needs map. Naikan converts “what do I need from them” into “what have I received.”'],
        ['History', 'Over-giving has a genealogy — the eldest son, the provider, the diaspora remittance economy — that makes it look like virtue. Naming it removes the shame that keeps it running.'],
        ['Unconventional', 'The exchange-rate sentence from your own practicum: a person whose word is reliable currency no longer has to purchase belonging with caretaking. A hypothesis; the ledger tests it.']
      ],
      evidence: [['SDT need satisfaction.', 'A'], ['NVC training: few controlled studies, modest effects; large practitioner base.', 'B/C'], ['Naikan.', 'B']],
      prompts: ['For one week, at day’s end: the three most energy-consuming things you did and the need each served. Rosenberg’s list or SDT’s three.', 'Then: was that a need, or a strategy for a need you have not named? Over-giving is a strategy. Under it is usually belonging or being chosen.', 'Naikan on Marie for one week: received, given, trouble caused. Where does the ledger surprise you?', 'The four unnamed needs the manual names — chosen, safety, worth, belonging. For each: the strategy you currently use, and what a direct request would sound like.', 'Third-person reread: what does Bate seem to believe he must do to be allowed to belong?', 'If-then: one direct request this week, in NVC form, where a strategy would have run.'],
      practices: ['needlog', 'directrequest', 'naikan'],
      read: ['Rosenberg — in the manual', 'Pink, Drive (2009)', 'Reynolds, Flowing Bridges, Quiet Waters (1989)'],
      trap: 'Analyzing needs instead of requesting them. This question produces beautiful inventories. The only evidence it worked is a request made out loud.' },

    { id: 16, cluster: 'D', text: 'How do I meet my wounds?', person: false, routing: true,
      reframe: 'The difference between understanding a wound and meeting one, and what container makes meeting safe. The question where the routing rule matters most.',
      lenses: [
        ['Psychology', 'Pennebaker’s expressive writing as the tested version of “meeting.” Rituals reduce grief in controlled experiments (Norton & Gino 2014) — direct support for the Two Waters as container. IFS “parts” language as a reflective lens only; thin evidence and a documented destabilization risk when protective parts are bypassed. Brach’s RAIN.'],
        ['Tradition', 'Somé: unwept grief hardens and blocks the flow of life; the Dagara grief ritual is communal for a reason. The salt-water release. Shiva as structured, time-bound, witnessed grief. “The sentences may be broken.”'],
        ['History', 'Modern Western culture is the first to make grief private and unscheduled. Nearly every other built a container with a start, a witness, and an end. The Two Waters is a solo reconstruction of that architecture.'],
        ['Unconventional', 'Unsent letters — to the person, the wound, the younger self. Narrative therapy; overlaps with expressive writing in evidence.']
      ],
      evidence: [['Expressive writing: meta-analyses.', 'A'], ['Ritual and grief: Norton & Gino 2014; Hobson et al. 2018.', 'B'], ['IFS: two RCTs, pilots, 2025 scoping review; destabilization risk documented.', 'C'], ['Somatic approaches: Brom et al. 2017.', 'B']],
      prompts: ['The difference between understanding a wound and meeting one, in your own words. Which do you usually do?', 'The wounds you know about — the ones that still run, not the whole history. For each: has it ever been witnessed by another person?', 'Pennebaker’s protocol on one wound: twenty minutes, four consecutive days, no editing. Day five, reread in third person.', 'RAIN on one feeling that arose: recognize it, allow it, investigate where it lives in the body, nurture it with one sentence you would say to a child.', 'The routing check: did any of this frighten you about yourself, or stay with you for days in a way you could not put down? If yes, Routing applies before any further session on this question.', 'If-then: one Two Waters session on the wound, container kept — invocation, work, closure — this week.'],
      practices: ['expressive', 'twowaters', 'unsentletter'],
      read: ['Pennebaker & Smyth, Opening Up by Writing It Down (2016)', 'Brach, Radical Acceptance (2003)', 'Somé, Of Water and the Spirit — in the manual', 'Schwartz, No Bad Parts (2021) — vocabulary only'],
      trap: 'Solo depth as bravery. Pursued alone, depth is not braver, only uncontained. The witness is not optional past a certain weight.' },

    { id: 2, cluster: 'E', text: 'What is true masculinity?', person: true,
      reframe: 'What kind of man is worth becoming, and what it costs. “True” as in plumb and load-bearing, not essential.',
      lenses: [
        ['Psychology', 'Real’s covert depression in men: disconnection from feeling as the male inheritance, repair through relational presence. APA 2018: rigid masculine norms — stoicism, self-reliance, dominance — predict worse mental and physical health.'],
        ['Tradition', 'Ìwà pẹ̀lẹ́ as the precondition of authority. Lorde on protective versus punitive force. Baldwin on the mask. hooks, The Will to Change.'],
        ['History', 'Kimmel’s Manhood in America for the breadwinner script. Somé and van Gennep on initiation. The Cross River Ekpe/Ngbe leopard society as a documented graded men’s institution in your own geography — verify with elders before claiming it.'],
        ['Unconventional', 'Men’s groups: observational studies show wellbeing gains; no RCTs. The mechanism, when it works, is witnessed vulnerability among men — the thing the amputation removed.']
      ],
      evidence: [['Rigid masculine norms and health: large survey literature; APA 2018.', 'A'], ['Men’s group participation: observational.', 'C'], ['Real’s clinical model: decades of use, no trials.', 'C']],
      prompts: ['Your own definition from the questionnaire — conscious, emotionally alive, respects women, worth not tied to stereotypes. For each clause: one man you know who embodies it, and one moment this month where you did not.', 'Real’s question: where does your own disconnection from feeling show up? The last time you answered “I’m fine” when it was false.', 'The four testable properties — keeps his word, holds another’s weather, protects without dominating, can be seen. Score yourself this month on each, with evidence.', 'Interview one man about his father. What was passed down, what was withheld. Fieldwork, not reflection.', 'If-then: one conversation with a man this week that goes past “how are you.”'],
      practices: ['mancall', 'fatherinterview'],
      read: ['Real, I Don’t Want to Talk About It (1997)', 'hooks, The Will to Change — in the manual', 'Kimmel, Manhood in America (1996)'],
      trap: 'Defining masculinity in a room alone. The question is a syllabus for a community; answered solo it becomes another framework.' },

    { id: 3, cluster: 'E', text: 'How do mind and speech relate to masculinity?', person: true,
      reframe: 'Whether the intellect is an instrument or a bunker, and whether speech is withheld, wielded, or offered. The question where your gift and your armor share a substance.',
      lenses: [
        ['Psychology', 'hooks on the sanctioned faculty: boys taught intellect is safe and feeling is soft. Rosenberg’s jackal and giraffe. Affect labeling: naming feelings aloud reduces their intensity — speech is where regulation happens, not only where masculinity is audited.'],
        ['Tradition', 'The conduction sequence: orí, then ìwà, then àṣẹ. Speech that runs the sequence carries authority; speech that skips to utterance is armor. Lorde on silence. Epictetus on the tongue.'],
        ['History', 'Oral cultures treated speech as consequential act, not commentary. The internal performance is a written-culture disease: a mind that learned to narrate rather than to speak.'],
        ['Unconventional', 'The clarity test: is there a defendant in this sentence? Improv’s “yes, and” as a speech discipline that forbids the case.']
      ],
      evidence: [['Affect labeling: Lieberman 2007 and replications.', 'B'], ['NVC.', 'B/C'], ['Improv and communication: Felsman.', 'B']],
      prompts: ['Three arguments you won this month. For each: what did winning cost the other person, and what did it cost you?', 'Three silences this month that were withholding rather than rest. What did each protect?', 'Run the conduction sequence on one thing you want to say to Marie: is it mine to say (orí)? Can I say it without armor (ìwà)? Then write it as you would say it (àṣẹ).', 'The clarity test on your last five messages to anyone: count the defendants.', 'If-then: one thing said this week from the inner head, without the case.'],
      practices: ['pause3', 'affectlabel', 'defendantcount'],
      read: ['Rosenberg', 'hooks', 'Epictetus, Enchiridion 33 and 41 — two pages'],
      trap: 'Eloquence. You have it, and it cannot be what earns the room. The practice is congruence repeated, and it sounds plainer than you like.' },

    { id: 17, cluster: 'E', text: 'What is the inherited history of men?', person: true, routing: true,
      reframe: 'What did I receive without choosing, from which sources, and which of it do I keep. An audit, and audits require documents.',
      lenses: [
        ['Psychology', 'hooks’s amputation. Real’s covert depression as the transmitted form. Intergenerational transmission of attachment: parents’ attachment states predict children’s.'],
        ['Tradition', 'Somé on the uninitiated man who overcompensates. Van Gennep’s three stages — separation, liminality, incorporation — and Turner on liminality. The Cross River Ekpe/Ngbe societies as graded initiation in your region, to be verified with elders.'],
        ['History', 'The breadwinner script is roughly 150 years old (Griswold, Rotundo, Blankenhorn on the industrial reorganization of fatherhood). Fanon on the colonial wound to manhood. The manual holds the four-layer account; this adds the instruction to check it against your own family.'],
        ['Unconventional', 'The genogram (Bowen, McGoldrick): a three-generation map with patterns marked — who provided, who left, who drank, who was silent. Drawing it produces insight that reading about inheritance does not.']
      ],
      evidence: [['Intergenerational transmission of attachment: meta-analyses.', 'A'], ['Masculine norms and outcomes.', 'A'], ['Genogram: clinical tool, decades of use, no trials.', 'C']],
      prompts: ['Draw the genogram: three generations, both sides. Mark providers, absentees, the silent, the violent, the tender, the ones who left, the ones who stayed. Two pages.', 'For each man on it, one line: what he passed down, what he withheld.', 'Your keep-and-burn list — keep respect for elders, family, living history; burn widow persecution, male impunity, women as property. For each burn item: the mechanism by which it was transmitted to you. Usually silence.', 'Interview one elder about initiation: what marked the passage from boy to man in their time, and who witnessed it. If nothing, that is the finding.', 'What your son will inherit from you if nothing changes. Then the one item you would change first.', 'If-then: the elder interview, this month.'],
      practices: ['genogram', 'elderinterview', 'burnlist'],
      read: ['Kimmel, Manhood in America', 'Real', 'McGoldrick, Genograms — first chapter is enough', 'Van Gennep, The Rites of Passage (1909) — introduction and chapter one', 'Somé — in the manual'],
      trap: 'Reading the history instead of drawing your own. The four-layer account is general. The genogram is yours, and where it contradicts the general account is where the real curriculum is.' }
  ],
  practices: {
    ifthen: { name: 'The if-then week', grade: 'A', freq: 'Weekly, Sunday', min: 2, record: 'One implementation intention, trigger named, in the ledger.', mapsTo: 'The àfọ̀ṣẹ sentence / Kept Word' },
    fivemin: { name: 'The five-minute start', grade: 'A', freq: 'When stuck', min: 5, record: 'Set a timer. Stop at five if you want. Five minutes cannot be perfect.', mapsTo: 'Behavioral activation' },
    arugamama: { name: 'Arugamama', grade: 'B', freq: 'When fear of starting arises', min: 1, record: 'Name it in one line (“fear of the first bad page is here”), then the next physical act — with the fear present, not after.', mapsTo: 'Morita' },
    sleepanchor: { name: 'The sleep anchor', grade: 'A', freq: 'Daily', min: 0, record: 'One fixed wake time, seven days a week, before any other sleep intervention. Not eight hours. One time.', mapsTo: 'CBT-I, first move' },
    greenhour: { name: 'The green hour', grade: 'A/B', freq: 'Daily', min: 20, record: 'Off pavement, among living things. Ravine, lakeshore, any wild edge. Intake, not exercise.', mapsTo: 'Nature exposure, 120 min/week' },
    refusal: { name: 'One refusal a week', grade: 'A', freq: 'Weekly', min: 1, record: 'One “no” where the caretaker would have said yes. Written with what it cost. The guilt afterward is the sound of the pattern losing.', mapsTo: 'Assertiveness training' },
    urgesurf: { name: 'Urge surfing', grade: 'A', freq: 'When the reach begins', min: 2, record: 'Do not fight it. Notice where it lives in the body, breathe, watch it crest and fall over ninety seconds.', mapsTo: 'Marlatt, relapse prevention' },
    oneword: { name: 'The one-word log', grade: 'B', freq: 'Three days', min: 0, record: 'One word per phone reach, before the reach. Affect labeling at the moment it matters.', mapsTo: 'Lieberman 2007' },
    cutoff: { name: 'The 9:30 cutoff', grade: 'B', freq: 'Nightly', min: 0, record: 'Already running. Phone charges outside the bedroom; grayscale after 9:00.', mapsTo: 'Digital friction' },
    morningminute: { name: 'The morning minute', grade: 'C', freq: 'Daily', min: 1, record: 'Before the phone: three breaths, one sentence of intention. Sixty seconds. This is the choose.', mapsTo: 'Omi tútù / Morning Anchor' },
    eveningreview: { name: 'The evening review', grade: 'C', freq: 'Daily', min: 5, record: 'One thing received; one moment toward what matters; one away; one line on what tomorrow asks; close. Examen, muhasaba and the Stoic review in their shortest shared form.', mapsTo: 'The Zengzi Close' },
    peacemap: { name: 'The peace map', grade: 'C', freq: 'One week', min: 1, record: 'At day’s end mark where any peace occurred: body, water, green, work, Marie, alone-withdrawn, alone-sanctuary. Seven days gives a map.', mapsTo: null },
    sigh: { name: 'Cyclic sighing', grade: 'A', freq: 'Daily, and before every session', min: 5, record: 'Nose in, second short inhale, long mouth exhale. Five minutes. The floor under everything else.', mapsTo: 'Return-in-Place' },
    hourlydrop: { name: 'The hourly drop', grade: 'B', freq: 'Hourly, one day', min: 0, record: 'The question, hourly, one word — the body part that answers first.', mapsTo: 'Interoception training' },
    focusing: { name: 'Focusing, short form', grade: 'B', freq: 'Weekly', min: 10, record: 'Clear a space; feel the whole problem in the body; find a word or image that fits; check it against the body; let it be.', mapsTo: 'Gendlin' },
    rehab: { name: 'The rehab', grade: 'A', freq: 'Once', min: 60, record: 'The ankles and knees. A physiotherapist, once. The body has been asking.', mapsTo: null },
    ladder: { name: 'The visibility ladder', grade: 'A', freq: 'One rung a week or faster', min: 0, record: 'Ten rungs, easiest to hardest, each an act of being seen unpolished. Predicted discomfort 1–10 before, actual after. The gap is the lesson.', mapsTo: 'Exposure' },
    preritual: { name: 'The pre-performance ritual', grade: 'B', freq: 'Before any rung', min: 1, record: 'Two long exhales, feet on the floor, one line. Arbitrary is fine. Consistent is what works.', mapsTo: 'Brooks et al. 2016' },
    improv: { name: 'Improv or Toastmasters', grade: 'B/C', freq: 'Once, as rung five or six', min: 90, record: 'One class or one meeting. Not to join. To test the rung.', mapsTo: 'Felsman et al.' },
    selfcompassion: { name: 'The self-compassion break', grade: 'A', freq: 'When the question fires', min: 1, record: 'Hand on chest, three sentences: this is a moment of suffering; suffering is part of being human; may I be kind to myself in this moment. Absurd for a week, then not.', mapsTo: 'Neff' },
    evidencefile: { name: 'The evidence file', grade: 'A/B', freq: 'Weekly', min: 2, record: 'One line, deed-anchored, earned only. Read it when the tribunal sits.', mapsTo: 'The Oríkì file, run as a positive data log' },
    rename: { name: 'Kross’s rename', grade: 'B', freq: 'When the loop starts', min: 0, record: '“Bate is asking whether he is enough again. What happened just before?” The third person has no defendant.', mapsTo: 'Self-distancing' },
    valuessort: { name: 'The values card sort', grade: 'A/B', freq: 'Once', min: 10, record: 'The ACT values list sorted very important / important / less. Keep the top five visible.', mapsTo: 'ACT' },
    withoutnod: { name: 'One act without the nod', grade: 'A', freq: 'Weekly', min: 0, record: 'Something done as if the audience did not exist. Logged with predicted and actual reaction.', mapsTo: 'Behavioral experiment' },
    publicsolitude: { name: 'Public solitude', grade: 'C', freq: 'Weekly', min: 5, record: 'In any public setting, five minutes of full attention on one task, as if alone. The stage skill, trained cheaply.', mapsTo: 'Stanislavski' },
    automation: { name: 'Automation', grade: 'A', freq: 'Once, then payday', min: 10, record: 'One transfer, automated, on payday, to the debt or the net. Removes the decision.', mapsTo: 'Save More Tomorrow' },
    securityprime: { name: 'Security priming', grade: 'B', freq: 'Weekly', min: 2, record: 'Recall one of the three safe moments in detail, in the body.', mapsTo: 'Mikulincer & Shaver' },
    holdingcall: { name: 'The holding call', grade: 'C', freq: 'Weekly', min: 20, record: 'One call to a man who holds you. Boris, Laurent-Olivier, Glenn. Not to report. To be held.', mapsTo: 'Ubuntu' },
    lifestory: { name: 'The life story chapters', grade: 'A', freq: 'Once; reread annually', min: 90, record: 'Chapters, scenes, and the redemption sequences where bad became good.', mapsTo: 'McAdams' },
    labelcheck: { name: 'The label check', grade: 'C', freq: 'Monthly', min: 5, record: 'Does each label I use lead me to a need this month, or end a question? Retire any that only end questions.', mapsTo: null },
    departurelog: { name: 'The departure log', grade: 'B', freq: 'Daily', min: 1, record: 'One line: longest departure, return trigger. Read weekly. The interval, measured.', mapsTo: 'Meta-awareness' },
    noting: { name: 'Noting', grade: 'A', freq: 'Daily', min: 5, record: 'Sit, and label each mental event with one word as it arises. Not the content. The category.', mapsTo: 'Vipassana / MBCT' },
    concreterewrite: { name: 'Concrete rewrite', grade: 'A/B', freq: 'When an abstract thought appears', min: 1, record: 'Rewrite it as a camera would record it.', mapsTo: 'Watkins / the Forge’s Concrete Test' },
    needlog: { name: 'The need log', grade: 'A/B', freq: 'Daily', min: 1, record: 'One line: the biggest energy spend and its need. Weekly review.', mapsTo: 'SDT' },
    directrequest: { name: 'The direct request', grade: 'B/C', freq: 'Weekly', min: 0, record: 'A request made in feeling-need-request form where the caretaker would have simply provided. Logged.', mapsTo: 'NVC' },
    naikan: { name: 'Naikan on one person', grade: 'B', freq: 'Weekly', min: 5, record: 'Received, given, trouble caused. Rotate the person.', mapsTo: 'Yoshimoto' },
    expressive: { name: 'Expressive writing, four days', grade: 'A', freq: 'Four consecutive days', min: 20, record: 'On one wound. Twenty minutes, no editing, then close.', mapsTo: 'Pennebaker' },
    twowaters: { name: 'Two Waters', grade: 'B', freq: 'Weekly', min: 30, record: 'With the container intact — invocation, work, closure. The frame is what makes intensity safe.', mapsTo: 'The Waters' },
    unsentletter: { name: 'The unsent letter', grade: 'B', freq: 'When a wound is named', min: 20, record: 'To the person, the wound, or the younger self. Written, read aloud once, kept or released.', mapsTo: 'Narrative therapy' },
    mancall: { name: 'The weekly man call', grade: 'C', freq: 'Weekly', min: 20, record: 'One structured call with one of the named men. What is heavy, what is good, what do you need. Rotate.', mapsTo: null },
    fatherinterview: { name: 'The father interview', grade: 'C', freq: 'Once', min: 45, record: 'Any man, about his father. Material for the community’s first module.', mapsTo: null },
    pause3: { name: 'The three-second pause', grade: 'C', freq: 'Before any consequential sentence', min: 0, record: 'One breath. The pause is where the sequence runs.', mapsTo: 'Epictetus' },
    affectlabel: { name: 'Affect labeling out loud', grade: 'B', freq: 'Daily', min: 0, record: 'Say a feeling aloud to someone: “I’m anxious about the interview.” Not processed. Named.', mapsTo: 'Lieberman 2007' },
    defendantcount: { name: 'The defendant count', grade: 'C', freq: 'Weekly', min: 5, record: 'Reread your messages; count sentences with a defendant. Watch the number fall.', mapsTo: 'The clarity test' },
    genogram: { name: 'The genogram', grade: 'C', freq: 'Once; kept', min: 60, record: 'Three generations, both sides, patterns marked. Reread when the community’s curriculum is written.', mapsTo: 'Bowen, McGoldrick' },
    elderinterview: { name: 'The elder interview', grade: 'C', freq: 'Quarterly', min: 45, record: 'Recorded, with permission. The archive the community will need.', mapsTo: null },
    burnlist: { name: 'The burn-list mechanism', grade: 'C', freq: 'Once per item', min: 10, record: 'For each inherited item you intend to end: its transmission mechanism, and one act that interrupts it.', mapsTo: null }
  },
  symbolic: {
    title: 'The Symbolic Lenses',
    barnum: 'Numerology, Human Design, astrology, tarot and their relatives have no predictive validity in controlled tests. Their descriptions feel accurate because of the Barnum effect: statements general enough to fit most people are experienced as personally accurate. That is not a reason to discard them. It is a reason to use them for what they are good at — generating prompts. A statement that feels accurate is data about what you believe about yourself. One that feels wrong is data too. The systems are mirrors that talk; the value is in your reaction, never in their claim.',
    numerology: 'Pythagorean method. Life path: write the birth date as digits (month, day, year), sum all digits, reduce to a single digit — except 11, 22 and 33 are kept as master numbers. Example: 15 March 1993 is 1+5+3+1+9+9+3 = 31, and 3+1 = 4. Expression number: letters A–Z valued 1–9 repeating (A=1 … I=9, J=1 …), sum the full birth name, reduce. Traditional meanings: 1 initiator; 2 partner; 3 expresser; 4 builder; 5 freedom-seeker; 6 caretaker; 7 seeker and analyst; 8 power and provision; 9 completer; 11 intuitive; 22 master builder; 33 master teacher. Compute both. Read the description. Write what resonated, what did not, and why. Then write which resonance you would have predicted from your own self-image — that last step is the whole exercise. Decide nothing from it.',
    hd: 'The Architecture holds the design. Same rule: Manifestor, 3/5, emotional authority are prompt generators, and the Q12 test governs them — does the label lead to a need, or end the inquiry?',
    rule: 'No symbolic system enters the ledger. The ledger records kept words, departures and requests. Nothing symbolic is ever a reason for or against an action recorded there.'
  },
  routing: {
    title: 'Routing — when the container is too small',
    intro: 'Q16 and parts of Q5 and Q17 can reach material solo work should not hold. Stop the session and route to a professional if any of the following occur:',
    signs: ['Material from a session stays with you for days in a way you cannot put down.', 'Sleep drops below four hours for more than a week, or eating stops.', 'Any thought of harming yourself — even fleeting, even “just a thought.”', 'Anything you learn about yourself that frightens you.', 'Grief that does not move after the container closes.'],
    options: 'In Ontario: a registered psychotherapist or psychologist (many offer sliding scale; Psychology Today’s directory filters by fee); the family doctor for referral; Ontario Structured Psychotherapy for CBT at no cost, by referral. A therapist trained in CBT, ACT, MBCT, expressive writing or somatic approaches will recognize everything here.',
    close: 'This is not the practice failing. It is the practice being honest about its scope — a sentence you wrote yourself.'
  }
};

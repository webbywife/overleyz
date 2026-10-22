"""Second symbol list → still-life ideas (python3 tools/local_vignettes.py symbols2). Same format as symbols.py.
Left out: Envy and Pride (negative), mourning/grave images, and anything already painted in the first two batches."""
import sys
from pathlib import Path

RAW = """
cracked-mirror | a small round hand mirror with a gentle crack across it | heartbroken | A crack / is not the end of the reflection.
fallen-tower | a small toy tower of blocks gently toppled beside a few scattered blocks | heartbroken | Fallen towers / can be rebuilt. Differently.
broken-wing | a small bird with one wing gently bandaged resting on a branch | heartbroken | A setback / is not the end of flight.
spilled-milk | a small milk jug tipped over with a soft spill | heartbroken | Let it spill. / There's more where that came from.
unfinished-bridge | a small wooden bridge that stops halfway over a stream | brave | Unfinished / is not the same as failed.
scar | a small green leaf with a pale healed line across it | calm | The pain closed. / You're still here.
herbs-balm | a small jar of balm beside a sprig of green herbs | calm | Gentle things / heal best.
spring-thaw | a small patch of melting snow with a green shoot underneath | hopeful | Slow recovery / is still recovery.
mended-cloth | a small cream cloth with neat pink stitching and a needle | calm | Care / is what repairs.
moss-stone | a small grey stone covered in soft green moss | calm | Quiet renewal / happens without a sound.
still-pond | a small round pond reflecting a soft sky with one floating leaf | growing | Be still enough / to see yourself.
hand-mirror | a small round hand mirror reflecting a pale sky | growing | Look inward / kindly.
cave-lantern | a small lantern glowing in a small dark cave mouth | growing | Searching your depths / takes a light.
journal | a small closed journal with a ribbon and a pencil | growing | Talk to yourself / the way you'd talk to a friend.
moonlit-window | a small window at night with a crescent moon and soft stars | calm | Evening thoughts / are quiet teachers.
burnt-candle | a small candle burned to a stub with a thin wisp of smoke | tired | You gave / until you ran low. Rest.
empty-well | a small stone well with a bucket hanging empty | tired | You can't draw / from an empty well.
dim-battery | a small battery with only one soft bar left | tired | Running on reserve / is still running. Recharge.
wilted-flower | a single wilted flower drooping in a small pot | tired | Even flowers / need watering.
cold-hearth | a small stone fireplace with cold grey ashes and one unlit log | tired | Rekindle gently. / One spark at a time.
trust-bridge | a small stone bridge over a stream with soft reflections | friends | Trust is / believing it will hold.
catch-hands | two open hands ready to catch a small falling feather | friends | Fall backward. / Someone's there.
handshake | two simple hands shaking, soft pastel sleeves | friends | A promise / made kindly is kept.
safe-harbor | a small boat tied safely at a tiny wooden dock | calm | A safe harbour / is someone you can count on.
unlocked-gate | a small garden gate slightly open with a flower beside it | hopeful | Openness / is a kind of courage.
intertwined-branches | two thin branches growing twined together with a few leaves | friends | Support / through every storm.
shared-umbrella | one umbrella with two pairs of small boots standing under it | friends | Stay close / when the rain comes.
twin-stars | two small stars close together | friends | Constant company / lights the sky.
walking-staff | a simple wooden walking staff with a small bundle | friends | A companion / makes any road lighter.
fork-road | a small signpost at a fork in a pale path | brave | Choose / and walk. You can adjust.
coin-toss | a single small silver coin spinning in the air | brave | Chance or conviction? / Listen for your answer.
crossroads | a small crossroads with four pale paths and a tiny tree | brave | A turning point / is also a beginning.
closed-open-door | a small closed door beside a small open door with soft light | hopeful | What you leave / and what you take.
summit | a small mountain with a tiny flag at the top | proud | Effort / rewarded.
laurel-wreath | a small green laurel wreath | proud | You earned / this moment.
ladder-top | a small ladder reaching the top of a tiny wall with a small bird | proud | One rung at a time / got you here.
opportunity-key | a small silver key with a pink ribbon | excited | Opportunity / unlocked.
finish-line | a small ribbon stretched across a short path | proud | Perseverance / completed.
heavy-stone | a single large grey stone with a soft shadow | tired | The weight carried / in silence counts.
storm-cloud | a small dark cloud with a tiny rain curl | anxious | Pain passes. / Clouds do too.
fire-refine | a small flame beneath a small crucible | brave | Suffering / can refine.
willow | a small willow tree with long drooping branches | lonely | Weep / and bend. / Both are allowed.
rain-glass | a small window glass with soft raindrops | lonely | Quiet sadness / is allowed to rain.
empty-bed | a small neatly made bed with one pillow | lonely | Absence is felt / most in small places.
distant-shore | a small boat looking toward a far shore | lonely | The far shore / is also waiting.
window-gazing | a small window with a cup on the sill and a pale sky outside | lonely | Yearning / is just love looking outward.
moon-reach | a small moon with a thin ladder reaching toward it | lonely | Reach / even for the unreachable.
unsent-letter | a small cream letter with a pink wax seal unopened | lonely | Words held back / still count.
echo | a small mountain with three curved sound lines | lonely | Some calls / return as echoes.
rearview | a small round rearview mirror reflecting a pale road | nostalgic | Look back / but don't stay.
dropped-glass | a small glass tipped over with a soft puddle | heartbroken | What can't be put back / can still be remembered.
faded-photo | a small faded photograph with soft sepia tones | nostalgic | Faded, / still loved.
wilted-rose | a single drooping rose in a small vase | heartbroken | Love not tended / needs another chance.
closed-book | a small closed book with a ribbon | nostalgic | Some chapters / stay closed. That's okay.
sapling | a small sapling with three leaves and a stake | growing | Slow, steady / growth.
stairs | a small set of stone steps climbing up | growing | Knowledge / is built step by step.
sponge | a small natural sponge soaking in a shallow dish | growing | Absorb / what's good.
lightbulb | a small glass lightbulb glowing softly | excited | Sudden insight / is a small joy.
lifted-veil | a small sheer veil lifted by a gentle wind | growing | The truth / was always behind it.
fog-sunrise | a small sun rising through soft fog over a hill | hopeful | Clarity / comes with the light.
open-eye | a single soft blue eye open | growing | Awareness / is the first step.
puzzle-click | two puzzle pieces clicking together | excited | It all / makes sense now.
warm-tea | a small cup of tea with soft steam and a lemon slice | calm | Quiet comfort / in a warm cup.
cat-sun | a small cat curled in a sunny patch | calm | Ease / is a sunbeam.
full-cup | a small cup filled to the brim | grateful | Enough. / A full cup.
calm-lake | a small round lake reflecting hills | calm | Inner stillness / mirrors the sky.
rocking-chair | a small wooden rocking chair with a cushion | calm | Peace / in the present.
tree-rings | a cross-section of a small tree with rings | nostalgic | Layers of time / are still beautiful.
old-key | a small old key with a faded ribbon | nostalgic | Memories / unlock with small things.
echo-bell | a small bell with soft curving sound lines | nostalgic | Voices / from the past still sing.
empty-ring | a small ring on a small dish | heartbroken | A promise ended. / You survived it.
cold-bed | a small bed seen from above with one side empty | heartbroken | Absence / is loud at night.
torn-photo | a small torn photograph pieced together by a thread | heartbroken | Separation / is not the whole story.
unlit-lamp | a small lamp unlit beside a matchbox | lonely | Warmth / can be lit again.
evergreen | a small evergreen fir tree | in-love | Love / that doesn't fade.
constant-flame | a small steady candle flame in a small lantern | in-love | Devotion / is a steady flame.
golden-thread | a small spool with a thin pale-yellow thread forming a heart | in-love | Unbreakable / connection.
home-rest | a small round nest-like cottage with a tiny green roof | in-love | Home / is where love rests.
two-halves | two small halves of a round locket that fit together | in-love | Two halves / one whole.
twin-flames | two small candle flames leaning toward each other | in-love | Mirrored spirits / burn beautifully.
entwined-vines | two green vines twining up a small post | in-love | Growing together / is love.
constellations | two small constellations of stars matching each other | in-love | Kinship / across distance.
spider-web | a small dew-covered spider web between two twigs | calm | Careful work / is beautiful.
spider | a small spider spinning on a thread | calm | Slowly, / carefully, / weave.
seed-underground | a small seed underground with a thin pale root | hopeful | Waiting / to rise.
slow-river | a slow river winding through soft hills | calm | Time / smooths what it touches.
incense | a small incense stick with a soft smoke curl | calm | Let the quiet / rise.
candle-church | a small votive candle in a small red glass | hopeful | Intention / offered, lit.
prayer-beads | a small loop of round wooden beads | calm | Repeat. / Breathe. / Rest.
eraser | a small pink eraser with a small pencil | growing | A chance / to correct.
crooked-path | a small crooked pale path through green grass | growing | A detour / that teaches.
cracked-pot | a small cracked clay pot holding water | growing | Imperfect, / and still holding water.
torn-page | a small torn page with a pencil | growing | A draft / to rewrite.
violet | a small cluster of violets with green leaves | calm | Modesty / blooms quietly.
bare-feet | a pair of small bare footprints in soft sand | calm | Simplicity / is a lighter way to walk.
low-door | a small low wooden door with an arched top | calm | Enter / with reverence.
empty-vessel | a small empty ceramic vase | calm | Room / to be filled.
fruit-tree | a small fruit tree with red apples and a basket | grateful | Offer / to all.
wrapped-gift | a small wrapped gift with a ribbon | grateful | Kindness / wrapped simply.
spring-water | a small spring of clear water trickling from a rock | grateful | A blessing / free-flowing.
ripe-fruit | two ripe peaches with a leaf | grateful | Simple / delight.
sugar | a small sugar bowl with a tiny spoon | grateful | Small joys / are sweet.
blossom | a small branch of white blossoms | grateful | Gentle charm.
lullaby | a small music box with a tiny star | calm | Soothing / comfort.
green-leaf | a single green leaf with fine veins | grateful | Gentle life / begins with one leaf.
warm-bread | a small warm loaf of bread with steam | grateful | Nourishing / kindness.
outgrown-shoes | a pair of tiny worn shoes beside a pair of bigger ones | nostalgic | You outgrew them. / Thank them.
height-marks | a small doorframe with pencil height marks | nostalgic | Growth / over time.
butterfly-emerging | a small butterfly emerging from a cocoon on a branch | growing | Becoming.
kite-let-go | a small kite on a string being released | letting-go | Independence / is a kite let go.
climbing-steps | a small set of steps with a tiny pair of shoes on one | growing | Maturity / is climbing steps.
torch-dark | a small torch burning in a soft dark | brave | Bravery / lights its own way.
climber | a tiny mountain with a small climber with a pack | brave | Reach / beyond limits.
unwritten-page | a small blank page with a pencil | hopeful | Open possibility.
crystal-ball | a small crystal ball on a stand reflecting soft colours | anxious | Uncertainty / is also possibility.
sealed-envelope | a small sealed envelope with a wax seal | hopeful | What is yet to come.
reed-wind | a small cluster of reeds bending in a soft wind | calm | Flexibility / is strength.
tide-bow | a small shell at the edge of a gentle wave | calm | Harmony / with the tide.
garden-flowers | a small garden bed of different flowers in rows | proud | Each has / its own season.
snowflake | a single detailed snowflake in pale blue | proud | No two alike.
footprints | a trail of small bare footprints in sand | proud | Your own path.
separate-lanes | a small pair of parallel pale paths with a tiny flag | proud | Your own race.
individual-stars | a few small stars of different sizes | proud | Each shines / in its own way.
guiding-hand | two hands: a big one holding a smaller one | friends | Gentle direction.
nest | a small nest with two eggs | friends | Safety / and shelter.
lantern-ahead | a small lantern held up on a stick lighting a path | friends | Light / a child's way.
gardener | a small watering can beside a row of seedlings | friends | Nurture / growth.
keystone | a small stone arch with a highlighted keystone | proud | The core / that supports everything.
roots-values | a small tree with deep roots visible in the soil | proud | Principles / hold firm.
rock-waves | a small rock with gentle waves around it | brave | Endure.
runner | small running shoes beside a medal ribbon | brave | Persistence.
forged-iron | a small iron horseshoe on a cloth | brave | Strength / through trial.
weed-pavement | a small green weed pushing through grey pavement | brave | Stubborn resilience.
upright-mountain | a small steady mountain under a pale sky | proud | Steady self-belief.
armor | a small helmet in soft metal on a cloth | proud | Protect yourself.
open-stride | a pair of small shoes mid-step on a pale path | proud | Walk / with purpose.
winding-road | a small winding road through hills | wanderlust | Discovery / is the road.
passport | a small passport with a few stamps | wanderlust | Stories / collected.
open-hands | two open hands palms up, with a small flower | grateful | Receive / thankfully.
harvest-basket | a small basket of apples, carrots and leaves | grateful | Abundance / acknowledged.
sunlight | a small beam of warm sunlight on a small green plant | grateful | Blessings / warm the face.
full-table | a small round table set with food and flowers | grateful | A heart / that notices what it has.
"""

SYMBOLS = {}
for line in RAW.strip().splitlines():
    k, o, m, n = (x.strip() for x in line.split("|"))
    SYMBOLS[k] = (o, m, n)

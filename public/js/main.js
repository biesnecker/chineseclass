class Flashcard {
    constructor(character, pinyin, definition, audio) {
        this.character = character;
        this.pinyin = pinyin;
        this.definition = definition;
        this.audio = audio;
    }
}

const rand_int = max => {
    return Math.floor(Math.random() * max);
}

const updateStats = (elem, tried, correct) => {
    var percent = 0.0;
    if (tried != 0) {
        percent = correct / tried;
    }
    elem.innerHTML = `${correct} / ${tried} (${(percent * 100).toFixed(2)}%)`;
}

$(document).ready(function () {

    const elem_datatable = $("#datatable")[0];
    const elem_character = $("#character")[0];
    const elem_pinyin = $("#pinyin")[0];
    const elem_stats = $("#stats")[0];
    const elem_options = [
        $("#option_0")[0],
        $("#option_1")[0],
        $("#option_2")[0],
        $("#option_3")[0],
    ];
    const elem_audio = $("#audiosource")[0];

    var cards_correct = 0;
    var cards_tried = 0;
    var mode = 0;
    var flashcards = [];

    const ts = Math.floor(Date.now() / 1000);

    $.getJSON(`data.json?ts=${ts}`, function (jd) {
        jd.forEach(element => {
            flashcards.push(new Flashcard(
                element.character,
                element.pinyin,
                element.definition,
                element.audio));
        });

        updateStats(elem_stats, cards_tried, cards_correct);

        var recent = [];
        const recent_max_size = Math.min(
            Math.max(Math.floor(flashcards.length / 2), 1),
            20);
        var recent_set = new Set();
        var recent_next_insert = 0;
        for (var i = 0; i < recent_max_size; ++i) {
            recent.push(null);
        }

        var right_answer_idx = 0;

        const next_card = () => {
            var card;
            var card_idx;
            var finished = false;
            if (recent[recent_next_insert] != null) {
                const n = recent[recent_next_insert];
                recent_set.delete(n);
                recent[recent_next_insert] = null;
            }

            while (!finished) {
                const idx = rand_int(flashcards.length);
                if (recent_set.has(idx)) {
                    continue;
                }
                card = flashcards[idx];
                recent[recent_next_insert] = idx;
                recent_next_insert = (recent_next_insert + 1);
                recent_next_insert %= recent_max_size;
                card_idx = idx;
                recent_set.add(idx);
                finished = true;
            }

            var alternate_definitions = new Set();
            var alternate_idx = 0;
            finished = false;
            while (alternate_definitions.size < 3) {
                alternate_idx = rand_int(flashcards.length);
                if (
                    alternate_idx == card_idx ||
                    alternate_definitions.has(alternate_idx)
                ) {
                    continue;
                }
                alternate_definitions.add(alternate_idx);
            }

            elem_character.innerHTML = card.character;
            elem_pinyin.innerHTML = card.pinyin;
            elem_audio.setAttribute('src', 'audio/' + card.audio);
            elem_audio.play();

            // This index is where the correct answer goes. The other indexes
            // get set with one of the alternate indexes.
            const alts = alternate_definitions.values();
            right_answer_idx = rand_int(4);
            for (var i = 0; i < 4; ++i) {
                if (i == right_answer_idx) {
                    elem_options[i].innerHTML = card.definition;
                } else {
                    elem_options[i].innerHTML = flashcards[alts.next().value].definition;
                }
            }
        }

        const click_handler = option_id => {
            const h = () => {
                if (mode == 1) {
                    return;
                }
                mode = 1;
                elem_datatable.classList.add('answer_mode');
                elem_options[right_answer_idx].classList.add('correct');
                ++cards_tried;
                const correct = option_id == right_answer_idx;
                if (correct) {
                    ++cards_correct;
                } else {
                    elem_options[option_id].classList.add('incorrect');
                }
                updateStats(elem_stats, cards_tried, cards_correct);
                setTimeout(() => {
                    mode = 0;
                    elem_datatable.classList.remove('answer_mode');
                    elem_datatable.classList.add('normal_mode');
                    elem_options[right_answer_idx].classList.remove('correct');
                    elem_options[option_id].classList.remove('incorrect');
                    next_card();
                }, correct ? 750 : 1500);
            }
            return h;
        }

        const audio_click_handler = () => {
            if (mode == 0 && elem_audio.hasAttribute('src')) {
                elem_audio.play();
            }
        }

        elem_character.addEventListener('click', audio_click_handler);
        elem_pinyin.addEventListener('click', audio_click_handler);

        for (var i = 0; i < 4; ++i) {
            elem_options[i].addEventListener('click', click_handler(i));
        }

        next_card();
    });


});
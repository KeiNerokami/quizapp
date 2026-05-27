(function () {
    "use strict";

    const MAX_QUESTIONS = 100;
    const STORAGE_KEY = "reime.quizJsonGenerator.entries.v1";
    const ZIP_NAME = "quiz-json-assets.zip";
    const FIELD_LABELS = {
        question: "Question",
        0: "Correct Answer",
        1: "Option 2",
        2: "Option 3",
        3: "Option 4"
    };

    const elements = {
        addButton: document.getElementById("addQuestionButton"),
        answersFile: document.getElementById("answersFile"),
        answersLabel: document.querySelector('label[for="answersFile"]'),
        counter: document.getElementById("questionCounter"),
        downloadButton: document.getElementById("downloadButton"),
        emptyState: document.getElementById("emptyState"),
        importButton: document.getElementById("importButton"),
        questionsFile: document.getElementById("questionsFile"),
        questionsLabel: document.querySelector('label[for="questionsFile"]'),
        status: document.getElementById("statusMessage"),
        tableBody: document.getElementById("quizTableBody")
    };

    const labelDefaults = {
        answers: elements.answersLabel.textContent,
        questions: elements.questionsLabel.textContent
    };

    let entries = loadEntries();

    bindEvents();
    render();
    if (entries.length >= MAX_QUESTIONS) {
        showLimitWarning();
    }

    function bindEvents() {
        elements.addButton.addEventListener("click", addQuestion);
        elements.downloadButton.addEventListener("click", downloadZip);
        elements.importButton.addEventListener("click", importJsonFiles);
        elements.tableBody.addEventListener("input", handleTableInput);
        elements.tableBody.addEventListener("click", handleTableClick);
        elements.questionsFile.addEventListener("change", function () {
            updateFileLabel(elements.questionsFile, elements.questionsLabel, labelDefaults.questions);
        });
        elements.answersFile.addEventListener("change", function () {
            updateFileLabel(elements.answersFile, elements.answersLabel, labelDefaults.answers);
        });
    }

    function blankEntry() {
        return {
            question: "",
            answers: ["", "", "", ""]
        };
    }

    function addQuestion() {
        if (entries.length >= MAX_QUESTIONS) {
            showLimitWarning();
            return;
        }

        entries.push(blankEntry());
        saveEntries();
        render();
        focusQuestion(entries.length - 1);

        if (entries.length >= MAX_QUESTIONS) {
            showLimitWarning();
            return;
        }

        setStatus("Question added. Edits save automatically.", "success");
    }

    function handleTableInput(event) {
        const field = event.target.closest(".field");
        if (!field) {
            return;
        }

        autoSizeField(field);

        const index = Number(field.dataset.index);
        if (!Number.isInteger(index) || !entries[index]) {
            return;
        }

        if (field.dataset.field === "question") {
            entries[index].question = field.value;
        } else if (field.dataset.field === "answer") {
            const answerIndex = Number(field.dataset.answerIndex);
            if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) {
                return;
            }
            entries[index].answers[answerIndex] = field.value;
        }

        saveEntries();
        updateFieldValidation(field);
        if (entries.length < MAX_QUESTIONS) {
            setStatus("Saved locally.", "success");
        }
    }

    function handleTableClick(event) {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }

        const index = Number(button.dataset.index);
        if (!Number.isInteger(index) || !entries[index]) {
            return;
        }

        if (button.dataset.action === "edit") {
            focusQuestion(index);
            setStatus("Editing row " + (index + 1) + ".", "success");
            return;
        }

        if (button.dataset.action === "delete") {
            entries.splice(index, 1);
            saveEntries();
            render();

            if (entries.length > 0) {
                focusQuestion(Math.min(index, entries.length - 1));
            }

            setStatus("Question deleted.", "success");
        }
    }

    function render() {
        const fragment = document.createDocumentFragment();

        entries.forEach(function (entry, index) {
            fragment.appendChild(createRow(entry, index));
        });

        elements.tableBody.replaceChildren(fragment);
        syncFieldSizes();
        updateValidationState();
        updateMeta();
    }

    function createRow(entry, index) {
        const row = document.createElement("tr");
        row.dataset.index = String(index);

        row.appendChild(createFieldCell({
            answerIndex: null,
            field: "question",
            index: index,
            label: "Question " + (index + 1),
            placeholder: "Enter question",
            value: entry.question
        }));

        entry.answers.forEach(function (answer, answerIndex) {
            row.appendChild(createFieldCell({
                answerIndex: answerIndex,
                field: "answer",
                index: index,
                label: answerIndex === 0
                    ? "Correct answer for question " + (index + 1)
                    : "Option " + (answerIndex + 1) + " for question " + (index + 1),
                placeholder: answerIndex === 0 ? "Correct answer" : "Option " + (answerIndex + 1),
                value: answer
            }));
        });

        const actionCell = document.createElement("td");
        const actionGroup = document.createElement("div");
        actionGroup.className = "actions";

        actionGroup.appendChild(createActionButton("Edit", "edit", index, "button button--neutral button--small"));
        actionGroup.appendChild(createActionButton("Delete", "delete", index, "button button--small button--danger"));
        actionCell.appendChild(actionGroup);
        row.appendChild(actionCell);

        return row;
    }

    function createFieldCell(config) {
        const cell = document.createElement("td");
        const field = document.createElement("textarea");

        field.className = "field";
        field.rows = config.field === "question" ? 2 : 1;
        field.placeholder = config.placeholder;
        field.required = true;
        field.spellcheck = true;
        field.value = config.value;
        field.setAttribute("aria-label", config.label);
        field.dataset.field = config.field;
        field.dataset.index = String(config.index);

        if (config.answerIndex !== null) {
            field.dataset.answerIndex = String(config.answerIndex);
        }

        cell.appendChild(field);
        return cell;
    }

    function createActionButton(label, action, index, className) {
        const button = document.createElement("button");
        button.className = className;
        button.type = "button";
        button.textContent = label;
        button.dataset.action = action;
        button.dataset.index = String(index);
        return button;
    }

    function updateMeta() {
        elements.counter.textContent = "Questions: " + entries.length + " / " + MAX_QUESTIONS;
        elements.emptyState.hidden = entries.length !== 0;
        elements.addButton.disabled = entries.length >= MAX_QUESTIONS;
    }

    function focusQuestion(index) {
        const field = elements.tableBody.querySelector('.field[data-field="question"][data-index="' + index + '"]');
        if (!field) {
            return;
        }

        field.focus();
        field.setSelectionRange(field.value.length, field.value.length);
    }

    function saveEntries() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        } catch (error) {
            setStatus("Unable to save local cache. Browser storage may be unavailable.", "error");
        }
    }

    function loadEntries() {
        let raw = null;

        try {
            raw = localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            setStatus("Local cache is unavailable in this browser.", "warning");
            return [];
        }

        if (!raw) {
            return [];
        }

        try {
            const parsed = JSON.parse(raw);
            const normalized = normalizeStoredEntries(parsed);
            if (!normalized) {
                setStatus("Stored cache was malformed and was ignored.", "warning");
                return [];
            }
            return normalized;
        } catch (error) {
            setStatus("Stored cache could not be read and was ignored.", "warning");
            return [];
        }
    }

    function normalizeStoredEntries(value) {
        if (!Array.isArray(value) || value.length > MAX_QUESTIONS) {
            return null;
        }

        const normalized = [];
        for (const item of value) {
            if (!item || typeof item.question !== "string" || !Array.isArray(item.answers)) {
                return null;
            }

            if (item.answers.length !== 4 || item.answers.some(function (answer) {
                return typeof answer !== "string";
            })) {
                return null;
            }

            normalized.push({
                question: item.question,
                answers: item.answers.slice(0, 4)
            });
        }

        return normalized;
    }

    async function importJsonFiles() {
        const questionsFile = elements.questionsFile.files[0];
        const answersFile = elements.answersFile.files[0];

        if (!questionsFile || !answersFile) {
            setStatus("Select both questions.json and answers.json before importing.", "error");
            return;
        }

        try {
            setStatus("Reading import files.", "");
            const questionsText = await readTextFile(questionsFile);
            const answersText = await readTextFile(answersFile);
            const questions = parseJson(questionsText, "questions.json");
            const answers = parseJson(answersText, "answers.json");
            const importedEntries = validateImportData(questions, answers);

            entries = importedEntries;
            saveEntries();
            render();
            resetFileInputs();

            if (entries.length >= MAX_QUESTIONS) {
                setStatus("Imported 100 questions. Question limit reached; delete a row before adding another.", "warning");
                return;
            }

            setStatus("Imported " + entries.length + " question" + (entries.length === 1 ? "" : "s") + ".", "success");
        } catch (error) {
            setStatus(error.message, "error");
        }
    }

    function readTextFile(file) {
        if (typeof file.text === "function") {
            return file.text();
        }

        return new Promise(function (resolve, reject) {
            const reader = new FileReader();
            reader.onload = function () {
                resolve(String(reader.result || ""));
            };
            reader.onerror = function () {
                reject(new Error("Unable to read " + file.name + "."));
            };
            reader.readAsText(file);
        });
    }

    function parseJson(text, label) {
        try {
            return JSON.parse(text);
        } catch (error) {
            throw new Error(label + " is not valid JSON.");
        }
    }

    function validateImportData(questions, answers) {
        if (!Array.isArray(questions) || questions.some(function (question) {
            return typeof question !== "string";
        })) {
            throw new Error("questions.json must be a 1D array of strings.");
        }

        if (!Array.isArray(answers)) {
            throw new Error("answers.json must be a 2D array of answer rows.");
        }

        if (questions.length !== answers.length) {
            throw new Error("questions.json and answers.json must contain the same number of rows.");
        }

        if (questions.length > MAX_QUESTIONS) {
            throw new Error("Import contains " + questions.length + " questions. The maximum is " + MAX_QUESTIONS + ".");
        }

        return questions.map(function (question, index) {
            const answerRow = answers[index];

            if (!Array.isArray(answerRow)) {
                throw new Error("answers.json row " + (index + 1) + " must be an array.");
            }

            if (answerRow.length !== 4) {
                throw new Error("answers.json row " + (index + 1) + " must contain exactly 4 strings.");
            }

            if (answerRow.some(function (answer) {
                return typeof answer !== "string";
            })) {
                throw new Error("answers.json row " + (index + 1) + " contains a non-string value.");
            }

            return {
                question: question,
                answers: answerRow.slice(0, 4)
            };
        });
    }

    async function downloadZip() {
        const exportError = getExportValidationError();
        if (exportError) {
            updateValidationState();
            setStatus(exportError.message, "error");
            focusField(exportError.index, exportError.answerIndex);
            return;
        }

        const files = [
            {
                name: "questions.json",
                content: JSON.stringify(entries.map(function (entry) {
                    return entry.question;
                }), null, 2) + "\n"
            },
            {
                name: "answers.json",
                content: JSON.stringify(entries.map(function (entry) {
                    return entry.answers.slice(0, 4);
                }), null, 2) + "\n"
            }
        ];

        try {
            setStatus("Preparing ZIP download.", "");
            const blob = await createZipBlob(files);
            triggerDownload(blob, ZIP_NAME);

            if (entries.length >= MAX_QUESTIONS) {
                showLimitWarning();
                return;
            }

            setStatus("Downloaded " + ZIP_NAME + ".", "success");
        } catch (error) {
            setStatus("Unable to create ZIP file: " + error.message, "error");
        }
    }

    async function createZipBlob(files) {
        if (window.JSZip) {
            try {
                const zip = new window.JSZip();
                files.forEach(function (file) {
                    zip.file(file.name, file.content);
                });
                return await zip.generateAsync({
                    compression: "DEFLATE",
                    type: "blob"
                });
            } catch (error) {
                console.warn("JSZip failed. Falling back to stored ZIP output.", error);
            }
        }

        return createStoredZipBlob(files);
    }

    function triggerDownload(blob, fileName) {
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.href = url;
        link.download = fileName;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    function updateFileLabel(input, label, fallback) {
        const file = input.files[0];
        label.textContent = file ? file.name : fallback;
        label.title = file ? file.name : "";
    }

    function resetFileInputs() {
        elements.questionsFile.value = "";
        elements.answersFile.value = "";
        updateFileLabel(elements.questionsFile, elements.questionsLabel, labelDefaults.questions);
        updateFileLabel(elements.answersFile, elements.answersLabel, labelDefaults.answers);
    }

    function setStatus(message, type) {
        elements.status.textContent = message;
        elements.status.className = "status";

        if (type) {
            elements.status.classList.add("status--" + type);
        }
    }

    function showLimitWarning() {
        setStatus("Question limit reached (100 / 100). Delete a row before adding another.", "warning");
    }

    function getExportValidationError() {
        if (entries.length === 0) {
            return {
                answerIndex: null,
                index: null,
                message: "Add at least one complete question before exporting."
            };
        }

        for (let index = 0; index < entries.length; index += 1) {
            if (!entries[index].question.trim()) {
                return {
                    answerIndex: null,
                    index: index,
                    message: "Fill every field before exporting. Row " + (index + 1) + " is missing Question."
                };
            }

            for (let answerIndex = 0; answerIndex < 4; answerIndex += 1) {
                if (!entries[index].answers[answerIndex].trim()) {
                    return {
                        answerIndex: answerIndex,
                        index: index,
                        message: "Fill every field before exporting. Row " + (index + 1) + " is missing " + FIELD_LABELS[answerIndex] + "."
                    };
                }
            }
        }

        return null;
    }

    function updateValidationState() {
        elements.tableBody.querySelectorAll(".field").forEach(updateFieldValidation);
    }

    function updateFieldValidation(field) {
        const isEmpty = field.value.trim() === "";
        field.classList.toggle("field--invalid", isEmpty);
        field.setAttribute("aria-invalid", String(isEmpty));
    }

    function syncFieldSizes() {
        elements.tableBody.querySelectorAll(".field").forEach(autoSizeField);
    }

    function autoSizeField(field) {
        field.style.height = "auto";
        field.style.height = Math.max(44, field.scrollHeight) + "px";
    }

    function focusField(index, answerIndex) {
        if (index === null) {
            elements.addButton.focus();
            return;
        }

        const selector = answerIndex === null
            ? '.field[data-field="question"][data-index="' + index + '"]'
            : '.field[data-field="answer"][data-index="' + index + '"][data-answer-index="' + answerIndex + '"]';
        const field = elements.tableBody.querySelector(selector);

        if (!field) {
            return;
        }

        field.focus();
        field.setSelectionRange(field.value.length, field.value.length);
    }

    // Minimal ZIP writer used when the CDN copy of JSZip is unavailable.
    function createStoredZipBlob(files) {
        const encoder = new TextEncoder();
        const localParts = [];
        const centralParts = [];
        const timestamp = toDosTimestamp(new Date());
        let offset = 0;

        files.forEach(function (file) {
            const nameBytes = encoder.encode(file.name);
            const dataBytes = encoder.encode(file.content);
            const checksum = crc32(dataBytes);
            const localHeader = createLocalFileHeader(nameBytes, dataBytes.length, checksum, timestamp);
            const centralHeader = createCentralDirectoryHeader(nameBytes, dataBytes.length, checksum, timestamp, offset);

            localParts.push(localHeader, dataBytes);
            centralParts.push(centralHeader);
            offset += localHeader.length + dataBytes.length;
        });

        const centralOffset = offset;
        const centralSize = centralParts.reduce(function (total, part) {
            return total + part.length;
        }, 0);
        const endRecord = createEndOfCentralDirectory(files.length, centralSize, centralOffset);
        const zipBytes = concatUint8Arrays(localParts.concat(centralParts, endRecord));

        return new Blob([zipBytes], { type: "application/zip" });
    }

    function createLocalFileHeader(nameBytes, dataLength, checksum, timestamp) {
        const header = new Uint8Array(30 + nameBytes.length);
        const view = new DataView(header.buffer);

        writeUint32(view, 0, 0x04034b50);
        writeUint16(view, 4, 20);
        writeUint16(view, 6, 0x0800);
        writeUint16(view, 8, 0);
        writeUint16(view, 10, timestamp.time);
        writeUint16(view, 12, timestamp.date);
        writeUint32(view, 14, checksum);
        writeUint32(view, 18, dataLength);
        writeUint32(view, 22, dataLength);
        writeUint16(view, 26, nameBytes.length);
        writeUint16(view, 28, 0);
        header.set(nameBytes, 30);

        return header;
    }

    function createCentralDirectoryHeader(nameBytes, dataLength, checksum, timestamp, offset) {
        const header = new Uint8Array(46 + nameBytes.length);
        const view = new DataView(header.buffer);

        writeUint32(view, 0, 0x02014b50);
        writeUint16(view, 4, 20);
        writeUint16(view, 6, 20);
        writeUint16(view, 8, 0x0800);
        writeUint16(view, 10, 0);
        writeUint16(view, 12, timestamp.time);
        writeUint16(view, 14, timestamp.date);
        writeUint32(view, 16, checksum);
        writeUint32(view, 20, dataLength);
        writeUint32(view, 24, dataLength);
        writeUint16(view, 28, nameBytes.length);
        writeUint16(view, 30, 0);
        writeUint16(view, 32, 0);
        writeUint16(view, 34, 0);
        writeUint16(view, 36, 0);
        writeUint32(view, 38, 0);
        writeUint32(view, 42, offset);
        header.set(nameBytes, 46);

        return header;
    }

    function createEndOfCentralDirectory(fileCount, centralSize, centralOffset) {
        const record = new Uint8Array(22);
        const view = new DataView(record.buffer);

        writeUint32(view, 0, 0x06054b50);
        writeUint16(view, 4, 0);
        writeUint16(view, 6, 0);
        writeUint16(view, 8, fileCount);
        writeUint16(view, 10, fileCount);
        writeUint32(view, 12, centralSize);
        writeUint32(view, 16, centralOffset);
        writeUint16(view, 20, 0);

        return record;
    }

    function toDosTimestamp(date) {
        const year = Math.min(Math.max(date.getFullYear(), 1980), 2107);
        const month = date.getMonth() + 1;
        const day = date.getDate();

        return {
            date: ((year - 1980) << 9) | (month << 5) | day,
            time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
        };
    }

    function concatUint8Arrays(parts) {
        const totalLength = parts.reduce(function (total, part) {
            return total + part.length;
        }, 0);
        const output = new Uint8Array(totalLength);
        let offset = 0;

        parts.forEach(function (part) {
            output.set(part, offset);
            offset += part.length;
        });

        return output;
    }

    const CRC_TABLE = createCrcTable();

    function createCrcTable() {
        const table = new Uint32Array(256);

        for (let i = 0; i < 256; i += 1) {
            let value = i;
            for (let bit = 0; bit < 8; bit += 1) {
                value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
            }
            table[i] = value >>> 0;
        }

        return table;
    }

    function crc32(bytes) {
        let crc = 0xffffffff;

        for (let i = 0; i < bytes.length; i += 1) {
            crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
        }

        return (crc ^ 0xffffffff) >>> 0;
    }

    function writeUint16(view, offset, value) {
        view.setUint16(offset, value, true);
    }

    function writeUint32(view, offset, value) {
        view.setUint32(offset, value >>> 0, true);
    }
}());

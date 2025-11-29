const modal = document.querySelector(".confirm-modal");
const columnContainer = document.querySelector(".columns");
const columns = document.querySelectorAll(".column");

let currentTask = null;

//functions

// place caret at the end of a contenteditable element
const setCaretToEnd = (el) => {
	el.focus();
	const range = document.createRange();
	const sel = window.getSelection();

	// If element has child nodes, place caret after the last child
	if (el.lastChild) {
		try {
			range.selectNodeContents(el);
			range.collapse(false);
			sel.removeAllRanges();
			sel.addRange(range);
			return;
		} catch (err) {
			// fall through to safe fallback
		}
	}

	// Fallback: append an empty text node and place caret there
	const textNode = document.createTextNode('');
	el.appendChild(textNode);
	range.setStart(textNode, 0);
	range.collapse(true);
	sel.removeAllRanges();
	sel.addRange(range);
};

const handleDeleteTask = (e) => {
	currentTask = e.target.closest(".task");

	//show preview
	const previewEl = modal.querySelector(".preview");
	previewEl.innerText = currentTask.innerText.substring(0, 100);
	modal.showModal();
}

const handleEditTask = (e) => {
	const taskEl = e.target.closest(".task");
	const taskText = taskEl.querySelector("p").innerText;
	const taskInput = createTaskInputElement(taskText.replace(/<br>/g, '\n'));
	taskEl.replaceWith(taskInput);
	// focus and move caret to end for editing
	setCaretToEnd(taskInput);
}

//handle blur event on task input
const handleBlur = (e) => {
	const taskInput = e.target;
	const taskText = taskInput.innerText.trim() || "Untitled";
	const taskEl = createTaskElement(taskText.replace(/\n/g, '<br>'));
	taskInput.replaceWith(taskEl);

	//move cursor to end
	const range = document.createRange();
	const sel = window.getSelection();
	range.selectNodeContents(taskEl);
	range.collapse(false);
	sel.removeAllRanges();
	sel.addRange(range);
}

//handle add task
handleaddTask = (e) => {
	const taskEl = e.target.closest(".column").lastElementChild;
	const taskInput = createTaskInputElement();
	taskEl.appendChild(taskInput);
	// focus and place caret at end for new task input
	setCaretToEnd(taskInput);
}

//update task count
const updateTaskCount = (column) => {
	const taskCount = column.querySelector(".tasks").children.length;
	column.querySelector(".column-title h2").dataset.tasks = taskCount;
}

//drag and drop handlers

const handleDragStart = (e) => {
	e.dataTransfer.setData("text/plain", ""); // for Firefox compatibility
	e.dataTransfer.effectAllowed = "move";
	requestAnimationFrame(() => {
		e.target.classList.add("dragging");
	});

};

const handleDragOver = (e) => {
	e.preventDefault();

	const draggedTask = document.querySelector(".dragging");
	if (!draggedTask) return;

	const targetTask = e.target.closest(".task");
	const targetContainer = e.target.closest(".tasks");

	if (!targetContainer) return;

	if (targetTask && targetTask !== draggedTask) {
		const { top, height } = targetTask.getBoundingClientRect();
		const distance = top + height / 2;

		if (e.clientY < distance) {
			targetTask.before(draggedTask);
		} else {
			targetTask.after(draggedTask);
		}
	} else if (!targetTask) {
		targetContainer.appendChild(draggedTask);
	}
};

const handleDrop = (e) => {
	e.preventDefault();
};

const handleDragEnd = (e) => {
	// console.log("Drag ended");
	e.target.classList.remove("dragging");
};

//observe task changes
const ObserveTaskChanges = () => {
	for (const column of columns) {
		const observer = new MutationObserver(() => {
			updateTaskCount(column);
		});
		observer.observe(column.querySelector(".tasks"), { childList: true });
	}
};

ObserveTaskChanges();

// Add dragover listeners to columns
columns.forEach((column) => {
	const taskContainer = column.querySelector(".tasks");
	taskContainer.addEventListener("dragover", handleDragOver);
	taskContainer.addEventListener("drop", handleDrop);
});

//create task element
const createTaskElement = (taskText) => {
	const task = document.createElement("div");
	task.classList.add("task");
	task.setAttribute("draggable", "true");
	task.innerHTML =
		`<p>${taskText}</p>
		<menu>
			<button data-edit><i class="fa-solid fa-pen-to-square"></i></button>
			<button data-delete><i class="fa-solid fa-trash"></i></button>
		</menu>`;

	task.addEventListener("dragstart", handleDragStart);
	task.addEventListener("dragend", handleDragEnd);
	return task;
};

//create task input element
const createTaskInputElement = (taskText = "") => {
	const taskInput = document.createElement("div");
	taskInput.classList.add("task-input");
	taskInput.dataset.placeholder = "Task Name";
	taskInput.setAttribute("contenteditable", "true");
	taskInput.innerText = taskText;

	// Save when user presses Ctrl+Enter (or Cmd+Enter on Mac)
	taskInput.addEventListener('keydown', (ev) => {
		if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
			ev.preventDefault();
			// trigger blur to save
			taskInput.blur();
		}
	});

	// Ensure blur still saves via handleBlur
	taskInput.addEventListener("blur", handleBlur);

	// When focused programmatically, ensure caret is at end
	taskInput.addEventListener('focus', () => setCaretToEnd(taskInput));

	return taskInput;
};


//handle add, edit, delete task
columnContainer.addEventListener("click", (e) => {
	if (e.target.closest("[data-add]")) {
		handleaddTask(e);
	} else if (e.target.closest("[data-edit]")) {
		handleEditTask(e);
	} else if (e.target.closest("[data-delete]")) {
		handleDeleteTask(e);
	}
});

//confirm deletion
modal.addEventListener("submit", (e) => {
	// Only delete if user clicked confirm (returnValue will be "confirm" button's value)
	// If cancel was clicked, returnValue will be empty or "cancel"
	if (modal.returnValue === '' || modal.returnValue === 'confirm') {
		currentTask && currentTask.remove();
	}
});

//cancel deletion
modal.querySelector('#cancel').addEventListener('click', () => {
	modal.close('cancel'); // pass 'cancel' as returnValue
});

//clear current task on modal close
modal.addEventListener('close', () => { currentTask = null });


//dummy placeholder tasks for testing
let tasks = [["Write project proposal📊", "Design wireframes for the new app📱"],
["Develop user authentication module🔐", "Set up database schema🗄️"],
["Create marketing plan📈", "Draft social media content📝"]];

tasks.forEach((taskList, colIndex) => {
	const column = columns[colIndex];
	taskList.forEach((taskText) => {
		const taskEl = createTaskElement(taskText);
		column.querySelector(".tasks").appendChild(taskEl);
	});
});

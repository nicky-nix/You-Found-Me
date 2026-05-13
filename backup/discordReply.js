function toggleReplyBox() {
	// ─── ADD THIS: Play click sound ───
	audio.click.currentTime = 0;
	audio.click.play().catch(() => {});

	const replyArea = document.getElementById("reply-area");
	const replyBtn = document.getElementById("reply-btn");
	const nameInput = document.getElementById("reply-name");
	const messageInput = document.getElementById("reply-input");
	const statusText = document.getElementById("reply-status");

	if (replyArea.style.display === "none") {
		replyArea.style.display = "block";
		replyBtn.textContent = "🚀 Send Reply";
		document.getElementById("parchment").scrollTop =
			document.getElementById("parchment").scrollHeight;
		nameInput.focus();
	} else {
		const nameValue = nameInput.value.trim();
		const msgValue = messageInput.value.trim();

		if (nameValue !== "" || msgValue !== "") {
			if (nameValue === "") {
				statusText.style.display = "block";
				statusText.style.color = "#ff4444";
				statusText.textContent = "Please enter your name! 🤍";
				nameInput.focus();
				return;
			}
			if (!nameValue.toLowerCase().includes("hyacinth")) {
				statusText.style.display = "block";
				statusText.style.color = "#ff4444";
				statusText.textContent =
					"This mailbox is reserved for my wifey only. Name mo po:>🔒";
				nameInput.focus();
				return;
			}
			if (msgValue === "") {
				statusText.style.display = "block";
				statusText.style.color = "#ff4444";
				statusText.textContent = "Please type a message! 🌸";
				messageInput.focus();
				return;
			}
			sendReplyToDiscord(nameValue, msgValue);
		} else {
			replyArea.style.display = "none";
			replyBtn.textContent = "✍️ Reply";
			statusText.style.display = "none";
		}
	}
}

function sendReplyToDiscord(authorName, replyMessage) {
	const statusText = document.getElementById("reply-status");
	const replyBtn = document.getElementById("reply-btn");

	statusText.style.display = "block";
	statusText.style.color = "#ffd700";
	statusText.textContent = "Sending via carrier pigeon... 🕊️";
	replyBtn.disabled = true;

	const discordWebhookUrl =
		"https://discord.com/api/webhooks/1503654821704630332/npab-qTmGPzCNq9Hvy5RmOrZwQkQezsportS75r5yy2oNsK6l0JGgHrlbLhdXvuP-C-9";

	const payload = {
		username: "Birb Delivery Island Service",
		avatar_url: "https://i.imgur.com/vHco7O6.png",
		embeds: [
			{
				description: `> 💖 **From Your Wifey:** \`${authorName}\`\n> ⏳ **Time:** <t:${Math.floor(Date.now() / 1000)}:F> (<t:${Math.floor(Date.now() / 1000)}:R>)\n\n🌸 ───────────────────────────── 🌸`,
				title: `\n${replyMessage}\n`,
				color: 16738740,
				thumbnail: { url: "https://i.imgur.com/vHco7O6.png" },
				footer: {
					text: "Always Yours • You Found Me Engine",
					icon_url: "https://i.imgur.com/vHco7O6.png",
				},
			},
		],
	};

	fetch(discordWebhookUrl, {
		method: "POST",
		mode: "cors",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	})
		.then((res) => {
			if (res.ok || res.status === 204 || res.status === 200) {
				statusText.style.color = "#6aaa50";
				statusText.textContent = "Reply sent securely to Discord! ❤️";
				document.getElementById("reply-name").value = "";
				document.getElementById("reply-input").value = "";
				setTimeout(() => {
					document.getElementById("reply-area").style.display = "none";
					replyBtn.textContent = "✍️ Reply";
					replyBtn.disabled = false;
					statusText.style.display = "none";
				}, 3000);
			} else {
				throw new Error("Not OK");
			}
		})
		.catch((err) => {
			statusText.style.color = "#ff4444";
			statusText.textContent = "Network error. Try again!";
			replyBtn.disabled = false;
			console.error("Webhook Error:", err);
		});
}

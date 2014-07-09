<stylesheet>
	<template match="/html">
		<html lang="en">
		<copy-of select="head"/>
		<body>
			<copy-of select="body/@*"/>
			<div class="4game">
				<copy-of select="body/*"/>
			</div>
		</body>
		</html>
	</template>
</stylesheet>
import { createSlice, PayloadAction } from '@reduxjs/toolkit'import { gameStorage } from '@/src/utils/localStorage'

interface GameState {
	script: string
	image: string | null
}

const initialState: GameState = {
	script: '',
	image: null,
}

const gamesSlice = createSlice({
	name: 'games',
	initialState,
	reducers: {
		setScript(state, action: PayloadAction<string>) {
			state.script = action.payload
			gameStorage.setScript(action.payload)
		},
		setImage(state, action: PayloadAction<string | null>) {
			state.image = action.payload
			gameStorage.setImage(action.payload)
		},
		loadStateFromLocalStorage(state) {
			const script = gameStorage.getScript()
			const image = gameStorage.getImage()
			if (script) {
				state.script = script
			}
			if (image) {
				state.image = image
			}
		},
		clearGameState(state) {
			state.script = ''
			state.image = null
			gameStorage.clear()
		},
	},
})

export const { setScript, setImage, loadStateFromLocalStorage, clearGameState } =
	gamesSlice.actions
export default gamesSlice.reducer

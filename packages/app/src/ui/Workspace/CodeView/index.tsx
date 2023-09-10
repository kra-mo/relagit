const path = window.Native.DANGEROUS__NODE__REQUIRE('path');

import { createSignal, For, Show } from 'solid-js';

import highlighter, { langFrom } from '@modules/highlighter';
import { createStoreListener } from '@stores/index';
import { DIFF_CODES } from '@modules/git/constants';
import { parseDiff } from '@modules/git/diff';
import LocationStore from '@stores/location';
import FilesStore from '@stores/files';
import * as Git from '@modules/git';

import EmptyState, { EMPTY_STATE_IMAGES } from '@ui/Common/EmptyState';
import Icon from '@ui/Common/Icon';

import type { GitDiff } from 'parse-git-diff';

import './index.scss';

export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.tiff', '.svg'];

const status = (e: 'UnchangedLine' | 'AddedLine' | 'DeletedLine') => {
	switch (e) {
		case 'UnchangedLine':
			return 'unchanged';
		case 'AddedLine':
			return 'added';
		case 'DeletedLine':
			return 'deleted';
	}
};

export interface ICodeViewProps {
	file: string;
	repository: string;
}

export default (props: ICodeViewProps) => {
	const [showOverridden, setShowOverridden] = createSignal<boolean>(false);
	const [shouldShow, setShouldShow] = createSignal<boolean>(false);
	const [diff, setDiff] = createSignal<GitDiff | null | true>();
	const [content, setContent] = createSignal<string>('');

	const changes = createStoreListener([FilesStore], () =>
		FilesStore.getFilesByRepositoryPath(props.repository)
	);

	createStoreListener([LocationStore, FilesStore], async () => {
		if (!props.file || !props.repository) {
			return;
		}

		setShowOverridden(false);

		const contents = await Git.Content(props.file, props.repository);
		const _diff = await Git.Diff(props.file);

		setContent(highlighter(contents, langFrom(props.file)));

		if (_diff === DIFF_CODES.REMOVE_ALL) {
			setDiff(null);
		} else if (_diff === DIFF_CODES.ADD_ALL) {
			setDiff(true);
		} else {
			const parsed = parseDiff(_diff);
			setDiff(parsed);
		}

		if (!diff() || diff() === true) {
			setShouldShow(true);
		} else {
			setShouldShow((diff() as GitDiff)?.files?.[0]?.chunks.length < 10);
		}
	});

	return (
		<Show
			when={props.file && props.repository}
			fallback={
				<>
					<Show
						when={props.repository}
						fallback={
							<EmptyState
								detail="No repository selected."
								hint={
									'See over there where it says "No Repository Selected"? Yeah, click that.'
								}
								image={{
									light: EMPTY_STATE_IMAGES.L_NOTHING_HERE,
									dark: EMPTY_STATE_IMAGES.D_NOTHING_HERE
								}}
							/>
						}
					>
						<Show
							when={changes()?.length}
							fallback={
								<EmptyState
									detail="No pending changes!"
									hint="Go take a break! You've earned it."
									image={{
										light: EMPTY_STATE_IMAGES.L_NOTHING_HERE,
										dark: EMPTY_STATE_IMAGES.D_NOTHING_HERE
									}}
								/>
							}
						>
							<EmptyState
								detail="No files selected."
								hint="Click one in the sidebar over there （´・｀） to get started."
								image={{
									light: EMPTY_STATE_IMAGES.L_NOTHING_HERE,
									dark: EMPTY_STATE_IMAGES.D_NOTHING_HERE
								}}
							/>
						</Show>
					</Show>
				</>
			}
		>
			<Show
				when={!IMAGE_EXTENSIONS.includes(path.extname(props.file))}
				fallback={
					<div class="codeview-image">
						{/* TODO */}
						<div class="codeview-image__container removed">
							<Icon name="image" />
						</div>
						<div class="codeview-image__container added">
							<Icon name="image" />
						</div>
					</div>
				}
			>
				<Show
					when={shouldShow() || showOverridden()}
					fallback={
						<>
							<EmptyState
								detail="Files too powerful!"
								hint="This file is sooo huge that we aren't rendering it for performance reasons."
								actions={[
									{
										label: 'Show',
										type: 'brand',
										onClick: () => {
											setShowOverridden(true);
										}
									}
								]}
								image={{
									light: EMPTY_STATE_IMAGES.L_POWER,
									dark: EMPTY_STATE_IMAGES.D_POWER
								}}
							/>
						</>
					}
				>
					<pre class="codeview">
						<Show
							when={diff() !== true && diff() !== null}
							fallback={
								<For each={content().split('\n')}>
									{(line, index) => {
										const status = diff() ? 'added' : 'deleted';

										return (
											<div class={`codeview__line ${status}`}>
												<div class="codeview__line__number">{index()}</div>
												<div
													class="codeview__line__content"
													innerHTML={line}
												></div>
											</div>
										);
									}}
								</For>
							}
						>
							<For each={(diff() as GitDiff)?.files?.[0]?.chunks}>
								{(chunk) => {
									const from =
										chunk.type == 'Chunk'
											? chunk.fromFileRange
											: { start: 0, lines: 0 };
									const to = chunk.toFileRange;

									const isLastChunk =
										(diff() as GitDiff).files?.[0]?.chunks?.indexOf(chunk) ===
										(diff() as GitDiff).files?.[0]?.chunks?.length - 1;
									const isFirstChunk =
										(diff() as GitDiff).files?.[0]?.chunks?.indexOf(chunk) ===
										0;

									return (
										<>
											<div class="codeview__line message">
												<div class="codeview__line__number">
													<Show
														when={isFirstChunk}
														fallback={<Icon name="fold" />}
													>
														<Icon name="fold-up" />
													</Show>
												</div>
												<div class="codeview__line__content">
													@@ -{from.start},{from.lines} +{to.start},
													{to.lines} @@ {chunk.context}
												</div>
											</div>
											<For each={chunk.changes}>
												{(change) => {
													// @ts-expect-error - bad types
													const line_number_one = change.lineBefore || '';
													// @ts-expect-error - bad types
													const line_number_two = change.lineAfter || '';

													if (change.type === 'MessageLine') return null;

													return (
														<div
															class={`codeview__line ${status(
																change.type
															)}`}
														>
															<div class="codeview__line__number">
																{line_number_one}
															</div>
															<div class="codeview__line__number">
																{line_number_two}
															</div>
															<div
																class="codeview__line__content"
																innerHTML={highlighter(
																	change.content,
																	langFrom(props.file)
																)}
															></div>
														</div>
													);
												}}
											</For>
											<Show when={isLastChunk}>
												<div class="codeview__line message">
													<div class="codeview__line__number">
														<Icon name="fold-down" />
													</div>
													<div class="codeview__line__content"></div>
												</div>
											</Show>
										</>
									);
								}}
							</For>
						</Show>
					</pre>
				</Show>
			</Show>
		</Show>
	);
};
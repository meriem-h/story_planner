import React, { useState, useEffect, useMemo } from 'react'

import { Network } from 'lucide-react'

const MIN_NODE_WIDTH = 150
const EDIT_NODE_HEIGHT = 70
const CARD_WIDTH = 92
const CARD_HEIGHT = 88
const CARD_GAP = 10
const CARDS_PER_ROW = 3
const AVATAR_RADIUS = 26
const PADDING = 14
const LEVEL_GAP = 70
const SIBLING_GAP = 24

export default function OrganizationChart(props) {

    const wrapTitle = (title, maxCharsPerLine = 18) => {
        if (!title || title.length <= maxCharsPerLine) return [title]
        const words = title.split(' ')
        let line1 = ''
        let i = 0
        while (i < words.length && (line1 + words[i]).length <= maxCharsPerLine) {
            line1 += (line1 ? ' ' : '') + words[i]
            i++
        }
        if (!line1 && words.length > 0) { line1 = words[0]; i = 1 }
        let line2 = words.slice(i).join(' ')
        if (line2.length > maxCharsPerLine) line2 = line2.slice(0, maxCharsPerLine - 1) + '…'
        return line2 ? [line1, line2] : [line1]
    }

    const getNodeSize = (node) => {
        const titleLines = wrapTitle(node.title).length
        const titleHeight = titleLines === 2 ? 44 : 30

        if (props.mode === 'edit') return { width: MIN_NODE_WIDTH, height: Math.max(EDIT_NODE_HEIGHT, titleHeight + 40) }

        const occupants = props.charactersByGradeId[node.id] || []
        if (occupants.length === 0) return { width: MIN_NODE_WIDTH, height: titleHeight + EDIT_NODE_HEIGHT }

        const cols = Math.min(occupants.length, CARDS_PER_ROW)
        const rows = Math.ceil(occupants.length / CARDS_PER_ROW)
        const width = Math.max(MIN_NODE_WIDTH, cols * CARD_WIDTH + (cols - 1) * CARD_GAP + PADDING * 2)
        const height = titleHeight + rows * CARD_HEIGHT + (rows - 1) * CARD_GAP + PADDING
        return { width, height, titleHeight }
    }

    // aplatit le DAG en liste de noeuds uniques
    const flattenDAG = (roots) => {
        const visited = new Set()
        const result = []
        const visit = (node) => {
            if (visited.has(node.id)) return
            visited.add(node.id)
            result.push(node)
            node.children.forEach(visit)
        }
        roots.forEach(visit)
        return result
    }

    const layout = useMemo(() => {
        const allNodes = flattenDAG(props.tree)
        const sizeById = {}
        allNodes.forEach(n => { sizeById[n.id] = getNodeSize(n) })

        // calcule le niveau visuel de chaque noeud = max(niveau de tous ses parents) + rank
        const levelById = {}
        const computeLevel = (node, visited = new Set()) => {
            if (visited.has(node.id)) return levelById[node.id] ?? 0
            visited.add(node.id)

            if (node.parents.length === 0) {
                levelById[node.id] = 0
            } else {
                const parentLevels = node.parents.map(parentId => {
                    const parentNode = allNodes.find(n => n.id === parentId)
                    if (!parentNode) return 0
                    if (levelById[parentId] === undefined) computeLevel(parentNode, visited)
                    return levelById[parentId] ?? 0
                })
                levelById[node.id] = Math.max(...parentLevels) + (node.rank ?? 1)
            }
        }
        allNodes.forEach(n => computeLevel(n))

        // hauteur max par niveau
        const maxHeightByLevel = {}
        allNodes.forEach(n => {
            const lv = levelById[n.id] ?? 0
            maxHeightByLevel[lv] = Math.max(maxHeightByLevel[lv] || 0, sizeById[n.id].height)
        })

        // y cumulé par niveau
        const yByLevel = {}
        let cumulY = 0
        Object.keys(maxHeightByLevel).map(Number).sort((a, b) => a - b).forEach(lv => {
            yByLevel[lv] = cumulY
            cumulY += maxHeightByLevel[lv] + LEVEL_GAP
        })

        // largeur du sous-arbre d'un noeud (pour le layout horizontal)
        const subtreeWidth = (node, visited = new Set()) => {
            if (visited.has(node.id)) return sizeById[node.id].width
            visited.add(node.id)
            const ownWidth = sizeById[node.id].width
            if (node.children.length === 0) return ownWidth
            const childrenWidth = node.children.reduce((sum, c) => sum + subtreeWidth(c, new Set(visited)), 0)
                + SIBLING_GAP * (node.children.length - 1)
            return Math.max(ownWidth, childrenWidth)
        }

        // place chaque noeud
        const positions = []
        const placed = new Set()


        const place = (node, x) => {
            if (placed.has(node.id)) return
            placed.add(node.id)

            const lv = levelById[node.id] ?? 0
            const width = subtreeWidth(node)
            const centerX = x + width / 2
            const y = yByLevel[lv] ?? 0

            positions.push({ node, x: centerX, y, ...sizeById[node.id] })

            // d'abord les enfants avec un seul parent
            const soloChildren = node.children.filter(c => c.parents.length === 1)
            const multiChildren = node.children.filter(c => c.parents.length > 1)

            let childX = x
            soloChildren.forEach(child => {
                const childWidth = subtreeWidth(child)
                place(child, childX)
                childX += childWidth + SIBLING_GAP
            })

            // ensuite les enfants multi-parents
            multiChildren.forEach(child => {
                const childWidth = subtreeWidth(child)
                place(child, childX)
                childX += childWidth + SIBLING_GAP
            })
        }

        let rootX = 0
        props.tree.forEach(root => {
            place(root, rootX)
            rootX += subtreeWidth(root) + SIBLING_GAP * 2
        })

        // edges : pour chaque noeud, on regroupe ses parents
        // si un seul parent → ligne directe
        // si plusieurs parents → ligne horizontale entre tous les parents puis descend vers l'enfant
        const edges = []
        allNodes.forEach(node => {
            const childPos = positions.find(p => p.node.id === node.id)
            if (!childPos) return

            const parentPositions = node.parents
                .map(pid => positions.find(p => p.node.id === pid))
                .filter(Boolean)

            if (parentPositions.length === 0) return

            if (parentPositions.length === 1) {
                // edge simple
                edges.push({ type: 'simple', from: parentPositions[0], to: childPos })
            } else {
                // edge généalogique : ligne horizontale entre tous les parents
                edges.push({ type: 'multi', parents: parentPositions, to: childPos })
            }
        })

        // for (const pos of positions) {
        //     if (pos.node.parents.length <= 1) continue

        //     const parentPositions = pos.node.parents
        //         .map(pid => positions.find(p => p.node.id === pid))
        //         .filter(Boolean)

        //     if (parentPositions.length === 0) continue

        //     const avgX = parentPositions.reduce((sum, p) => sum + p.x, 0) / parentPositions.length
        //     pos.x = avgX
        // }

        for (const pos of positions) {
            if (pos.node.parents.length <= 1) continue
            const parentPositions = pos.node.parents
                .map(pid => positions.find(p => p.node.id === pid))
                .filter(Boolean)
            if (parentPositions.length === 0) continue
            pos.x = parentPositions.reduce((sum, p) => sum + p.x, 0) / parentPositions.length
        }


        const byLevel = {}
        for (const pos of positions) {
            const lv = levelById[pos.node.id] ?? 0
            if (!byLevel[lv]) byLevel[lv] = []
            byLevel[lv].push(pos)
        }
        for (const lv of Object.keys(byLevel)) {
            const nodes = byLevel[lv].sort((a, b) => a.x - b.x)
            for (let i = 1; i < nodes.length; i++) {
                const prev = nodes[i - 1]
                const curr = nodes[i]
                const minX = prev.x + prev.width / 2 + SIBLING_GAP + curr.width / 2
                if (curr.x < minX) curr.x = minX
            }
        }

        const totalWidth = positions.length > 0
            ? Math.max(MIN_NODE_WIDTH, ...positions.map(p => p.x + p.width / 2))
            : MIN_NODE_WIDTH
        const totalHeight = positions.length > 0
            ? Math.max(...positions.map(p => p.y + p.height))
            : EDIT_NODE_HEIGHT

        return { positions, edges, totalWidth: totalWidth + 20, totalHeight: totalHeight + 20 }
    }, [props.tree, props.mode, props.charactersByGradeId])

    useEffect(() => {
        if (props.onLayoutReady) props.onLayoutReady(layout)
    }, [layout])

    const posById = useMemo(() => {
        const map = {}
        layout.positions.forEach(p => { map[p.node.id] = p })
        return map
    }, [layout])



    const renderEdges = () => {
        // sépare les edges simples des multi
        const simpleEdges = layout.edges.filter(e => e.type === 'simple')
        const multiEdges = layout.edges.filter(e => e.type === 'multi')

        // regroupe les multi qui ont exactement les mêmes parents
        const groups = []
        multiEdges.forEach(edge => {
            const key = edge.parents.map(p => p.node.id).sort().join('-')
            const existing = groups.find(g => g.key === key)
            if (existing) {
                existing.children.push(edge.to)
            } else {
                groups.push({ key, parents: edge.parents, children: [edge.to] })
            }
        })


        return (
            <>
                {/* edges simples */}
                {/* {simpleEdges.map((edge, i) => {
                    const from = edge.from
                    const to = edge.to
                    const fromY = from.y + from.height
                    const toY = to.y
                    const midY = fromY + (toY - fromY) / 2
                    const path = `M ${from.x} ${fromY} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${toY}`
                    return (
                        <path key={`simple-${i}`} d={path} fill='none' stroke='var(--primary-300, #a3a3a3)' strokeWidth={2} />
                    )
                })} */}

                {simpleEdges.map((edge, i) => {
                    const from = edge.from
                    const to = edge.to
                    const fromY = from.y + from.height
                    const toY = to.y

                    // vérifie si ce parent a aussi des enfants communs (multi)
                    const parentHasMultiChildren = groups.some(g =>
                        g.parents.some(p => p.node.id === from.node.id)
                    )

                    let path
                    if (parentHasMultiChildren) {
                        const offsetX = to.x === from.x ? 0 : (to.x < from.x ? -10 : 10)
                        const midY = fromY + (toY - fromY) / 2
                        path = `M ${from.x + offsetX} ${fromY} L ${from.x + offsetX} ${midY} L ${to.x} ${midY} L ${to.x} ${toY}`
                    } else {
                        const midY = fromY + (toY - fromY) / 2
                        path = `M ${from.x} ${fromY} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${toY}`
                    }

                    return (
                        <path key={`simple-${i}`} d={path} fill='none' stroke='var(--primary-300, #a3a3a3)' strokeWidth={2} />
                    )
                })}

                {/* edges multi groupés */}
                {groups.map((group, i) => {
                    const parents = group.parents
                    const children = group.children
                    const lowestParentY = Math.max(...parents.map(p => p.y + p.height))
                    const highestChildY = Math.min(...children.map(c => c.y))
                    // décale le midY de 15px par groupe pour éviter les superpositions
                    const midY = lowestParentY + (highestChildY - lowestParentY) / 2 + (i * 15)
                    const leftX = Math.min(...parents.map(p => p.x))
                    const rightX = Math.max(...parents.map(p => p.x))

                    return (
                        <g key={`multi-${i}`}>
                            {/* ligne verticale de chaque parent vers midY */}
                            {parents.map((parent, j) => (
                                <path
                                    key={`p-${j}`}
                                    d={`M ${parent.x} ${parent.y + parent.height} L ${parent.x} ${midY}`}
                                    fill='none'
                                    stroke='var(--primary-300, #a3a3a3)'
                                    strokeWidth={2}
                                />
                            ))}
                            {/* ligne horizontale entre les parents */}
                            <path
                                d={`M ${leftX} ${midY} L ${rightX} ${midY}`}
                                fill='none'
                                stroke='var(--primary-300, #a3a3a3)'
                                strokeWidth={2}
                            />
                            {/* ligne verticale vers chaque enfant */}
                            {children.map((child, j) => (
                                <path
                                    key={`c-${j}`}
                                    d={`M ${child.x} ${midY} L ${child.x} ${child.y}`}
                                    fill='none'
                                    stroke='var(--primary-300, #a3a3a3)'
                                    strokeWidth={2}
                                />
                            ))}
                        </g>
                    )
                })}
            </>
        )
    }

    const initialOf = (text) => text?.trim()?.charAt(0)?.toUpperCase() || '?'

    const renderAvatar = (avatarKey, cx, cy, imageUrl, label, isEmpty, radius = AVATAR_RADIUS, onAvatarClick = null) => {
        const clipId = `clip-${avatarKey}`
        const isHovered = props.hoveredAvatarKey === avatarKey
        const r = isHovered ? radius * 1.15 : radius
        return (
            <g
                key={avatarKey}
                style={{ cursor: onAvatarClick ? 'pointer' : 'default' }}
                onMouseEnter={() => onAvatarClick && props.setHoveredAvatarKey(avatarKey)}
                onMouseLeave={() => onAvatarClick && props.setHoveredAvatarKey(null)}
                onClick={onAvatarClick || undefined}
            >
                {imageUrl ? (
                    <>
                        <clipPath id={clipId}>
                            <circle cx={cx} cy={cy} r={r} />
                        </clipPath>
                        <image
                            href={imageUrl}
                            x={cx - r}
                            y={cy - r}
                            width={r * 2}
                            height={r * 2}
                            clipPath={`url(#${clipId})`}
                            preserveAspectRatio='xMidYMid slice'
                        />
                        <circle cx={cx} cy={cy} r={r} fill='none' stroke='white' strokeWidth={2} />
                    </>
                ) : (
                    <>
                        <circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill={isEmpty ? 'var(--primary-200, #e2e8f0)' : 'var(--primary-500, #64748b)'}
                        />
                        <text
                            x={cx}
                            y={cy}
                            textAnchor='middle'
                            dominantBaseline='central'
                            fontSize={r}
                            fontWeight='bold'
                            fill={isEmpty ? 'var(--primary-500, #64748b)' : 'white'}
                        >
                            {initialOf(label)}
                        </text>
                    </>
                )}
            </g>
        )
    }

    const renderNodes = () => {
        if (props.mode === 'edit') {
            return layout.positions.map(({ node, x, y, width, height }) => {
                const isDragOver = props.dragOverId === node.id
                const isHovered = props.hoveredId === node.id
                return (
                    <g
                        key={node.id}
                        transform={`translate(${x - width / 2}, ${y})`}
                        draggable
                        onDragStart={() => props.onDragStart(node)}
                        onDragOver={(e) => props.onDragOver(e, node)}
                        onDrop={(e) => props.onDrop(e, node)}
                        onMouseEnter={() => props.setHoveredId(node.id)}
                        onMouseLeave={() => props.setHoveredId(null)}
                        style={{ cursor: 'grab' }}
                    >
                        <rect
                            width={width}
                            height={height}
                            rx={12}
                            fill={isDragOver ? 'var(--primary-200, #bfdbfe)' : 'var(--primary-100, #dbeafe)'}
                            stroke={isHovered || isDragOver ? 'var(--primary-500, #3b82f6)' : 'var(--primary-300, #93c5fd)'}
                            strokeWidth={isHovered || isDragOver ? 2.5 : 1.5}
                        />
                        {(() => {
                            const lines = wrapTitle(node.title)
                            const lineHeight = 15
                            const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2
                            return (
                                <text x={width / 2} textAnchor='middle' fontSize='13' fontWeight='bold' fill='var(--primary-700, #1e3a8a)'>
                                    {lines.map((line, i) => (
                                        <tspan key={i} x={width / 2} y={startY + i * lineHeight} dominantBaseline='middle'>{line}</tspan>
                                    ))}
                                </text>
                            )
                        })()}
                    </g>
                )
            })
        }

        return layout.positions.map(({ node, x, y, width, height }) => {
            const occupants = props.charactersByGradeId[node.id] || []
            const hasOccupants = occupants.length > 0
            const centerX = width / 2
            const titleLines = wrapTitle(node.title)
            const titleAreaHeight = titleLines.length === 2 ? 44 : 30

            return (
                <g key={node.id} transform={`translate(${x - width / 2}, ${y})`}>
                    <rect
                        width={width}
                        height={height}
                        rx={12}
                        fill={hasOccupants ? 'var(--primary-100, #dbeafe)' : 'var(--primary-50, #f8fafc)'}
                        stroke={hasOccupants ? 'var(--primary-400, #60a5fa)' : 'var(--primary-300, #a3a3a3)'}
                        strokeWidth={hasOccupants ? 2.5 : 1.5}
                    />
                    <text x={centerX} textAnchor='middle' fontSize='12' fontWeight='bold' fill={hasOccupants ? 'var(--primary-700, #1e3a8a)' : 'var(--primary-700, #334155)'}>
                        {titleLines.map((line, i) => (
                            <tspan key={i} x={centerX} y={titleLines.length === 2 ? 17 + i * 16 : 18} dominantBaseline='middle'>{line}</tspan>
                        ))}
                    </text>

                    {hasOccupants ? (
                        occupants.map((char, i) => {
                            const row = Math.floor(i / CARDS_PER_ROW)
                            const colsInThisRow = Math.min(CARDS_PER_ROW, occupants.length - row * CARDS_PER_ROW)
                            const col = i % CARDS_PER_ROW
                            const rowWidth = colsInThisRow * CARD_WIDTH + (colsInThisRow - 1) * CARD_GAP
                            const rowStartX = (width - rowWidth) / 2
                            const cardX = rowStartX + col * (CARD_WIDTH + CARD_GAP)
                            const cardY = titleAreaHeight + row * (CARD_HEIGHT + CARD_GAP)
                            const avatarKey = `${node.id}-${char.id}`
                            return (
                                <g key={char.id} transform={`translate(${cardX}, ${cardY})`}>
                                    {renderAvatar(
                                        avatarKey,
                                        CARD_WIDTH / 2,
                                        AVATAR_RADIUS + 2,
                                        char.image_url,
                                        char.name,
                                        false,
                                        AVATAR_RADIUS,
                                        () => props.setPreviewSrc(char.image_url)
                                    )}
                                    <text
                                        x={CARD_WIDTH / 2}
                                        y={AVATAR_RADIUS * 2 + 14}
                                        textAnchor='middle'
                                        dominantBaseline='middle'
                                        fontSize='10'
                                        fill='var(--primary-600, #475569)'
                                    >
                                        {char.name.length > 12 ? char.name.slice(0, 11) + '…' : char.name}
                                    </text>
                                </g>
                            )
                        })
                    ) : (
                        renderAvatar(node.id, centerX, titleAreaHeight + (height - titleAreaHeight) / 2, null, node.title, true)
                    )}
                </g>
            )
        })
    }

    const renderHoveredAvatarOnTop = () => {
        if (props.mode === 'edit' || !props.hoveredAvatarKey) return null

        for (const { node, x, y, width } of layout.positions) {
            const occupants = props.charactersByGradeId[node.id] || []
            const index = occupants.findIndex(c => `${node.id}-${c.id}` === props.hoveredAvatarKey)
            if (index === -1) continue

            const char = occupants[index]
            const row = Math.floor(index / CARDS_PER_ROW)
            const colsInThisRow = Math.min(CARDS_PER_ROW, occupants.length - row * CARDS_PER_ROW)
            const col = index % CARDS_PER_ROW
            const rowWidth = colsInThisRow * CARD_WIDTH + (colsInThisRow - 1) * CARD_GAP
            const rowStartX = (width - rowWidth) / 2
            const titleAreaHeight = wrapTitle(node.title).length === 2 ? 44 : 30
            const cardX = (x - width / 2) + rowStartX + col * (CARD_WIDTH + CARD_GAP)
            const cardY = y + titleAreaHeight + row * (CARD_HEIGHT + CARD_GAP)

            return (
                <g transform={`translate(${cardX}, ${cardY})`}>
                    {renderAvatar(
                        props.hoveredAvatarKey,
                        CARD_WIDTH / 2,
                        AVATAR_RADIUS + 2,
                        char.image_url,
                        char.name,
                        false,
                        AVATAR_RADIUS,
                        () => props.setPreviewSrc(char.image_url)
                    )}
                </g>
            )
        }
        return null
    }

    if (props.tree.length === 0) {
        return (
            <div className='h-full flex flex-col items-center justify-center gap-2 text-primary-300'>
                <Network size={32} />
                <p>{props.mode === 'edit' ? "Aucun grade encore. Commence par créer le grade le plus élevé (ex: Doyen)." : "Cette organisation n'a encore aucun grade défini."}</p>
            </div>
        )
    }

    return (
        <svg width={props.totalWidth ?? layout.totalWidth} height={layout.totalHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
            {renderEdges()}
            {renderNodes()}
            {renderHoveredAvatarOnTop()}
        </svg>
    )
}
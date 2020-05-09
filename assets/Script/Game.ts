const { ccclass, property } = cc._decorator

@ccclass
export default class Game extends cc.Component {

  @property(cc.Label)
  statusLabel: cc.Label = null

  @property(cc.Node)
  knifeNode: cc.Node = null

  @property(cc.Node)
  targetArea: cc.Node = null

  @property(cc.Prefab)
  knifePrefab: cc.Prefab = null

  @property(cc.AudioClip)
  knifeClip: cc.AudioClip = null

  @property(cc.AudioClip)
  knifeHitClip: cc.AudioClip = null

  private _gaming: boolean = false
  private _angle: number = 90
  private _level: number = 1
  private _counter: number = 5
  private _dir: number = 1
  private _knifeCounter: number = 3
  private _knifeBucketNode: cc.Node = null

  onLoad() {
    this._knifeBucketNode = cc.find('knifeBucket', this.targetArea)
    this.node.on('touchstart', this._onTouchStart, this)
    this.targetArea.zIndex = 1
    this._rotateTarget()
    this._initKnife()

    // change angle
    setInterval(() => {
      this._dir = Math.random() > 0.5 ? 1 : -1
      this._angle = this._dir * (60 + 20 * Math.random())
    }, 2000)
  }

  onDestroy() {
    this.node.off('touchstart', this._onTouchStart, this)
  }

  private _rotateTarget(): void {
    const sq: cc.ActionInterval = cc.sequence(
      cc.rotateBy(1, this._angle),
      cc.callFunc(this._rotateTarget.bind(this))
    )
    this.targetArea.runAction(sq)
  }

  private _onTouchStart(): void {
    if (this._gaming) return
    this._gaming = true
    const seq: cc.ActionInterval = cc.sequence(
      cc.moveTo(.2, cc.v2(this.targetArea.x, this.targetArea.y - 50)),
      cc.callFunc(() => {
        const knife: cc.Node = cc.instantiate(this.knifePrefab)
        const pos: cc.Vec2 = this.knifeNode.parent.convertToWorldSpaceAR(this.knifeNode.position)
        knife.setPosition(this._knifeBucketNode.convertToNodeSpaceAR(pos))
        let angle: number = this.targetArea.angle % 360
        if (angle > 0) {
          angle = 360 - angle
        }
        knife.angle = Math.abs(angle)
        this._knifeBucketNode.addChild(knife)

        this._checkEnd(knife)

        this.knifeNode.position = cc.v2(0, -300)
      })
    )
    this.knifeNode.runAction(seq)
  }

  _checkEnd(knifeNode: cc.Node): void {
    const knifes: Array<cc.Node> = this._knifeBucketNode.children
    for (let i = 0, len = knifes.length; i < len; i++) {
      const knife: cc.Node = knifes[i]
      if (knife !== knifeNode && Math.abs(Math.abs(knife.angle % 360) - Math.abs(knifeNode.angle % 360)) < 15) {
        this._playKnifeHitSound()
        const pos: cc.Vec2 = this._knifeBucketNode.convertToWorldSpaceAR(knife.position)
        knife.removeFromParent(false)
        knife.setPosition(this.node.convertToNodeSpaceAR(pos))
        this.node.addChild(knife)
        const seq: cc.ActionInterval = cc.sequence(
          cc.spawn(
            cc.sequence(
              cc.moveBy(.2, cc.v2(-100 * this._dir, -100)).easing(cc.easeExponentialOut()),
              cc.moveBy(.5, cc.v2(-200 * this._dir, -1000)).easing(cc.easeExponentialIn()),
            ),
            cc.rotateBy(1, 180 * this._dir)
          ),
          cc.callFunc(() => {
            knife.destroy()
            cc.director.loadScene('game')
            this._gaming = false
          })
        )
        knife.runAction(seq)
        return
      }
    }
    this._counter--
    this._playKnifeCutterSound()
    if (this._counter <= 0) {
      setTimeout(() => {
        this._levelUp()
        this._updateStatus()
        this._gaming = false
      }, 1000)
      return
    }
    this._gaming = false
    this._updateStatus()
  }

  private _playKnifeCutterSound(): void {
    cc.audioEngine.play(this.knifeClip, false, 1)
  }

  private _playKnifeHitSound(): void {
    cc.audioEngine.play(this.knifeHitClip, false, 1)
  }

  private _levelUp(): void {
    this._level++
    this._knifeCounter += 1
    this._counter = 5
    this._initKnife()
  }

  private _initKnife(): void {
    this._knifeBucketNode.removeAllChildren()
    const getRandomAngle = (): number => (30 + Math.random() * 360)
    for (let i = 0; i < this._knifeCounter; i++) {
      const knife: cc.Node = cc.instantiate(this.knifePrefab)
      this._knifeBucketNode.addChild(knife)
      const angle: number = getRandomAngle()
      knife.angle = angle + 90
      const x: number = Math.cos(cc.misc.degreesToRadians(angle)) * 50
      const y: number = Math.sin(cc.misc.degreesToRadians(angle)) * 50
      knife.setPosition(x, y)
    }
  }

  private _updateStatus(): void {
    this.statusLabel.string = `Knifes: ${this._counter}, Level: ${this._level}`
  }

}

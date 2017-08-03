import mongoose from 'mongoose'
import autoref from 'mongoose-autorefs'
import autopopulate from 'mongoose-autopopulate'
import faker from 'faker'

const ManifestSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  //  NOTE: The original manifest is manitfests[0] in a proposal.
  proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal' },
  report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  //  Type: original, partial or supplemental
  type: String,
  //  Data for supplementals
  contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', autopopulate: true },
  title: String,
  body: String,
  // Is this the initial proposition? If not, it's a "partial" manifest for what was actually funded.
  // Items in the manifest.
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item', autopopulate: true }],
  // Total cost, should be calculated dynamically.
  total: { type: Number, required: true, default: 0 },
  //  Decisions are issues on manifests, which are an author's ask.
  decision: { type: mongoose.Schema.Types.ObjectId, ref: 'Decision' }
})
ManifestSchema.plugin(autoref, [
  'proposal.manifests',
  'report.manifest',
  'contact.manifest',
  'items.manifest',
  'decision.manifest'
])
ManifestSchema.plugin(autopopulate)
const Manifest = mongoose.model('Manifest', ManifestSchema)
export default Manifest

/* *****
FAKE DATA GENERATOR: Contact
***** */
const dummyManifests = (min, ids) => {
  //  Check the db for existing data satisfying min required
  Manifest.count().exec((err, count) => {
    if (err) {
      console.warn(`Unable to count Manifest schema: ${err}`)
    } else if (count < min) {
      //  If it didn't, inject dummies.
      let fakes = []
      for (let i = 0; i < min; i++) {
        fakes[i] = new Manifest({
          _id: ids.manifest[i],
          proposal: ids.proposal[i],
          block: ids.block[i],
          report: ids.report[i],
          contact: ids.contact[i],
          type: faker.company.bsNoun(),
          title: faker.company.bsNoun(),
          body: faker.lorem.paragraph(),
          items: [
            ids.item[i],
            ids.item[i]
          ],
          total: faker.random.number()
        })
        //  Some of these have been decided upon.
        if (faker.random.boolean()) {
          fakes[i].decision = ids.decision[i]
        }
      }
      //  Create will push our fakes into the DB.
      Manifest.create(fakes, (error) => {
        if (!error) { console.log(`SEED: Created fake Manifest (${fakes.length})`) }
      })
    }
  })
}

export { dummyManifests }
